"""
API Routes - Tất cả endpoints của ứng dụng
"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Query
from pydantic import BaseModel
from typing import Optional

from app.services import pdf_service, rag_service, quiz_service


router = APIRouter(prefix="/api", tags=["API"])


# ============================================================
# PYDANTIC MODELS (Request/Response schemas)
# ============================================================

class ChatRequest(BaseModel):
    document_id: str
    question: str
    top_k: int = 5


class ChatResponse(BaseModel):
    status: str = "success"
    data: dict


class QuizGenerateRequest(BaseModel):
    document_id: str
    num_questions: int = 5


class QuizSubmitRequest(BaseModel):
    quiz_id: str
    user_answers: list[int]


# ============================================================
# DOCUMENT ENDPOINTS
# ============================================================

# In-memory document registry (sẽ chuyển sang Firebase)
_documents: dict = {}


@router.post("/documents/upload", summary="Upload tài liệu PDF")
async def upload_document(file: UploadFile = File(...)):
    """
    Upload file PDF → Trích xuất text → Chia chunks → Lưu vào Vector DB.
    """
    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Chỉ hỗ trợ file PDF.")

    try:
        # Đọc file content
        content = await file.read()

        if len(content) == 0:
            raise HTTPException(status_code=400, detail="File rỗng.")

        # Lưu file vào disk
        document_id, file_path = pdf_service.save_uploaded_file(content, file.filename)

        # Xử lý PDF: extract text → chunking
        result = pdf_service.process_pdf(file_path, document_id)

        # Lưu chunks vào Vector DB
        num_stored = rag_service.store_chunks(document_id, result["chunks"])

        # Lưu metadata vào registry
        _documents[document_id] = {
            "document_id": document_id,
            "filename": file.filename,
            "total_pages": result["total_pages"],
            "total_chunks": result["total_chunks"],
            "file_path": file_path
        }

        return {
            "status": "success",
            "message": f"Đã xử lý thành công '{file.filename}'!",
            "data": {
                "document_id": document_id,
                "filename": file.filename,
                "total_pages": result["total_pages"],
                "total_chunks": num_stored
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý file: {str(e)}")


@router.get("/documents", summary="Liệt kê tài liệu đã upload")
async def list_documents():
    """Trả về danh sách tất cả tài liệu đã upload."""
    docs = list(_documents.values())
    return {
        "status": "success",
        "data": {
            "documents": docs,
            "total": len(docs)
        }
    }


@router.delete("/documents/{document_id}", summary="Xóa tài liệu")
async def delete_document(document_id: str):
    """Xóa tài liệu khỏi hệ thống (file + vectors)."""
    if document_id not in _documents:
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại.")

    # Xóa vectors từ ChromaDB
    rag_service.delete_document_vectors(document_id)

    # Xóa file PDF
    pdf_service.delete_document_file(document_id)

    # Xóa khỏi registry
    del _documents[document_id]

    return {"status": "success", "message": "Đã xóa tài liệu."}


# ============================================================
# CHAT / Q&A ENDPOINTS (RAG)
# ============================================================

@router.post("/chat", summary="Hỏi đáp với tài liệu (RAG)")
async def chat(request: ChatRequest):
    """
    RAG Pipeline: Nhận câu hỏi → Tìm context → LLM trả lời.
    AI chỉ trả lời dựa trên nội dung tài liệu đã upload.
    """
    if request.document_id not in _documents:
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại. Hãy upload PDF trước.")

    try:
        result = rag_service.chat_with_document(
            document_id=request.document_id,
            question=request.question,
            top_k=request.top_k
        )

        return {
            "status": "success",
            "data": {
                "question": request.question,
                "answer": result["answer"],
                "sources": result["sources"],
                "provider": result["provider"]
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi xử lý câu hỏi: {str(e)}")


# ============================================================
# SUMMARIZATION ENDPOINTS
# ============================================================

@router.post("/documents/{document_id}/summarize", summary="Tóm tắt tài liệu")
async def summarize_document(document_id: str):
    """AI tóm tắt các ý chính của tài liệu."""
    if document_id not in _documents:
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại.")

    try:
        result = rag_service.summarize_document(document_id)
        return {
            "status": "success",
            "data": {
                "document_id": document_id,
                "summary": result["summary"],
                "provider": result["provider"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tóm tắt: {str(e)}")


# ============================================================
# QUIZ ENDPOINTS
# ============================================================

@router.post("/quiz/generate", summary="Tạo quiz tự động từ tài liệu")
async def generate_quiz(request: QuizGenerateRequest):
    """AI quét tài liệu và sinh bộ câu hỏi trắc nghiệm."""
    if request.document_id not in _documents:
        raise HTTPException(status_code=404, detail="Tài liệu không tồn tại.")

    try:
        quiz = quiz_service.generate_quiz(
            document_id=request.document_id,
            num_questions=request.num_questions
        )
        return {
            "status": "success",
            "data": quiz
        }
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi tạo quiz: {str(e)}")


@router.post("/quiz/submit", summary="Nộp bài quiz và nhận kết quả")
async def submit_quiz(request: QuizSubmitRequest):
    """Chấm điểm bài làm quiz, phân tích lỗi sai."""
    try:
        result = quiz_service.submit_quiz(
            quiz_id=request.quiz_id,
            user_answers=request.user_answers
        )
        return {
            "status": "success",
            "data": result
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/quiz/history", summary="Lịch sử làm quiz")
async def quiz_history(document_id: Optional[str] = Query(None)):
    """Xem lịch sử điểm số các bài quiz."""
    history = quiz_service.get_quiz_history(document_id)
    return {
        "status": "success",
        "data": {
            "history": history,
            "total": len(history)
        }
    }
