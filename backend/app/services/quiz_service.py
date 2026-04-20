"""
Quiz Service - Tự động sinh Quiz trắc nghiệm từ tài liệu
"""
import json
import uuid
from typing import Optional
from datetime import datetime

from app.core.config import settings
from app.services.rag_service import get_chroma_client, generate_response


# ============================================================
# IN-MEMORY STORAGE (Sẽ chuyển sang Firebase sau)
# ============================================================

# Lưu trữ quiz results tạm thời trong memory
_quiz_store: dict = {}  # {quiz_id: quiz_data}
_quiz_history: list = []  # Lịch sử làm bài


# ============================================================
# QUIZ GENERATION
# ============================================================

QUIZ_PROMPT = """Bạn là giáo viên chuyên ra đề thi trắc nghiệm. Dựa HOÀN TOÀN vào nội dung tài liệu bên dưới, hãy tạo {num_questions} câu hỏi trắc nghiệm.

YÊU CẦU NGHIÊM NGẶT:
1. Mỗi câu hỏi có ĐÚNG 4 đáp án (A, B, C, D)
2. Chỉ có 1 đáp án đúng
3. Các đáp án sai phải hợp lý (dễ nhầm lẫn), KHÔNG được vô nghĩa
4. Kèm giải thích ngắn gọn cho đáp án đúng
5. TẤT CẢ câu hỏi, lựa chọn (A,B,C,D) và giải thích PHẢI được dịch và viết bằng tiếng Việt 100%, kể cả khi tài liệu gốc là tiếng Anh.
6. CHỈ dựa trên nội dung được cung cấp, KHÔNG bịa đặt

ĐỊNH DẠNG OUTPUT (JSON ARRAY):
[
  {{
    "question": "Câu hỏi ở đây?",
    "options": ["A. Đáp án 1", "B. Đáp án 2", "C. Đáp án 3", "D. Đáp án 4"],
    "correct_answer": 0,
    "explanation": "Giải thích tại sao đáp án A đúng..."
  }}
]

CHÚ Ý: correct_answer là INDEX (0=A, 1=B, 2=C, 3=D). Trả về ĐÚNG JSON, không thêm text thừa.

NỘI DUNG TÀI LIỆU:
{content}

JSON OUTPUT:"""


def generate_quiz(document_id: str, num_questions: int = 5) -> dict:
    """
    Tự động sinh bộ quiz trắc nghiệm từ tài liệu.

    Pipeline:
    1. Lấy nội dung tài liệu từ ChromaDB
    2. Gửi prompt cho LLM sinh câu hỏi
    3. Parse JSON response
    4. Lưu quiz vào store

    Returns:
        dict: {"quiz_id", "document_id", "questions": [...], "created_at"}
    """
    client = get_chroma_client()

    try:
        collection = client.get_collection(name=f"doc_{document_id}")
    except Exception:
        raise ValueError("Không tìm thấy tài liệu. Hãy upload PDF trước.")

    # Lấy nội dung tài liệu
    all_data = collection.get(include=["documents"])
    content = "\n\n".join(all_data["documents"])

    # Giới hạn text
    max_chars = 6000
    if len(content) > max_chars:
        content = content[:max_chars]

    # Gọi LLM sinh quiz
    prompt = QUIZ_PROMPT.format(num_questions=num_questions, content=content)
    raw_response = generate_response(prompt)

    # Parse JSON từ response của LLM
    questions = _parse_quiz_json(raw_response)

    if not questions:
        raise ValueError("AI không thể sinh quiz từ tài liệu này. Hãy thử lại.")

    # Tạo quiz object
    quiz_id = str(uuid.uuid4())
    quiz_data = {
        "quiz_id": quiz_id,
        "document_id": document_id,
        "questions": questions,
        "num_questions": len(questions),
        "created_at": datetime.now().isoformat()
    }

    # Lưu vào store
    _quiz_store[quiz_id] = quiz_data

    return quiz_data


def _parse_quiz_json(raw_response: str) -> list[dict]:
    """Parse JSON từ response LLM (xử lý các trường hợp format lỗi)."""
    # Thử parse trực tiếp
    try:
        return json.loads(raw_response)
    except json.JSONDecodeError:
        pass

    # Tìm JSON array trong response (LLM đôi khi thêm text thừa)
    start = raw_response.find("[")
    end = raw_response.rfind("]") + 1

    if start != -1 and end > start:
        try:
            return json.loads(raw_response[start:end])
        except json.JSONDecodeError:
            pass

    return []


# ============================================================
# QUIZ GRADING
# ============================================================

def submit_quiz(quiz_id: str, user_answers: list[int]) -> dict:
    """
    Chấm điểm bài làm quiz.

    Args:
        quiz_id: ID của quiz
        user_answers: List các index đáp án user chọn [0, 2, 1, 3, ...]

    Returns:
        dict: {"score", "total", "percentage", "details": [...]}
    """
    if quiz_id not in _quiz_store:
        raise ValueError("Quiz không tồn tại.")

    quiz = _quiz_store[quiz_id]
    questions = quiz["questions"]

    if len(user_answers) != len(questions):
        raise ValueError(f"Cần trả lời {len(questions)} câu, nhận được {len(user_answers)}.")

    correct_count = 0
    details = []

    for i, question in enumerate(questions):
        is_correct = user_answers[i] == question["correct_answer"]
        if is_correct:
            correct_count += 1

        details.append({
            "question_index": i,
            "question": question["question"],
            "user_answer": user_answers[i],
            "correct_answer": question["correct_answer"],
            "is_correct": is_correct,
            "explanation": question.get("explanation", "")
        })

    percentage = round((correct_count / len(questions)) * 100, 1)

    result = {
        "quiz_id": quiz_id,
        "document_id": quiz["document_id"],
        "score": correct_count,
        "total": len(questions),
        "percentage": percentage,
        "details": details,
        "submitted_at": datetime.now().isoformat()
    }

    # Lưu vào lịch sử
    _quiz_history.append(result)

    return result


def get_quiz_history(document_id: Optional[str] = None) -> list[dict]:
    """Lấy lịch sử làm quiz (có thể filter theo document)."""
    if document_id:
        return [h for h in _quiz_history if h["document_id"] == document_id]
    return _quiz_history


def get_quiz_by_id(quiz_id: str) -> Optional[dict]:
    """Lấy quiz theo ID."""
    return _quiz_store.get(quiz_id)
