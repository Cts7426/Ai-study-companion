"""
RAG Service - Retrieval-Augmented Generation Pipeline
Hỗ trợ 2 LLM provider: Ollama (primary) và Gemini (backup)
"""
import chromadb
from sentence_transformers import SentenceTransformer
from typing import Optional
import json

from app.core.config import settings


# ============================================================
# SINGLETON: Khởi tạo 1 lần, dùng xuyên suốt app
# ============================================================

_embedding_model: Optional[SentenceTransformer] = None
_chroma_client: Optional[chromadb.PersistentClient] = None


def get_embedding_model() -> SentenceTransformer:
    """Lazy-load embedding model (chỉ load lần đầu)."""
    global _embedding_model
    if _embedding_model is None:
        print(f"[RAG] Đang tải embedding model: {settings.EMBEDDING_MODEL}...")
        _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
        print("[RAG] ✅ Embedding model đã sẵn sàng!")
    return _embedding_model


def get_chroma_client() -> chromadb.PersistentClient:
    """Lazy-load ChromaDB client."""
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        print("[RAG] ✅ ChromaDB đã kết nối!")
    return _chroma_client


# ============================================================
# VECTOR DATABASE OPERATIONS
# ============================================================

def store_chunks(document_id: str, chunks: list[dict]) -> int:
    """
    Lưu chunks vào ChromaDB dưới dạng vector embeddings.

    Args:
        document_id: ID của tài liệu
        chunks: List chunks từ pdf_service

    Returns:
        Số lượng chunks đã lưu
    """
    client = get_chroma_client()
    model = get_embedding_model()

    # Mỗi document có 1 collection riêng trong ChromaDB
    collection = client.get_or_create_collection(
        name=f"doc_{document_id}",
        metadata={"document_id": document_id}
    )

    # Tạo embeddings cho tất cả chunks
    texts = [chunk["text"] for chunk in chunks]
    embeddings = model.encode(texts).tolist()

    # Lưu vào ChromaDB
    collection.add(
        ids=[chunk["chunk_id"] for chunk in chunks],
        documents=texts,
        embeddings=embeddings,
        metadatas=[{
            "document_id": chunk["document_id"],
            "start_page": chunk["start_page"],
            "end_page": chunk["end_page"]
        } for chunk in chunks]
    )

    return len(chunks)


def search_relevant_chunks(
    document_id: str,
    query: str,
    top_k: int = 5
) -> list[dict]:
    """
    Tìm kiếm các chunks liên quan nhất với câu hỏi (Semantic Search).

    Pipeline:
    1. Embed câu hỏi thành vector
    2. So khớp cosine similarity trong ChromaDB
    3. Trả về top-K chunks có điểm cao nhất

    Returns:
        List[dict]: [{"text": "...", "start_page": 1, "end_page": 1, "score": 0.85}, ...]
    """
    client = get_chroma_client()
    model = get_embedding_model()

    collection_name = f"doc_{document_id}"

    try:
        collection = client.get_collection(name=collection_name)
    except Exception:
        return []

    # Embed câu hỏi
    query_embedding = model.encode([query]).tolist()

    # Truy vấn ChromaDB
    results = collection.query(
        query_embeddings=query_embedding,
        n_results=min(top_k, collection.count()),
        include=["documents", "metadatas", "distances"]
    )

    # Format kết quả
    relevant_chunks = []
    if results and results["documents"]:
        for i, doc in enumerate(results["documents"][0]):
            relevant_chunks.append({
                "text": doc,
                "start_page": results["metadatas"][0][i].get("start_page", 0),
                "end_page": results["metadatas"][0][i].get("end_page", 0),
                "score": 1 - results["distances"][0][i]  # Chuyển distance → similarity
            })

    return relevant_chunks


def delete_document_vectors(document_id: str) -> bool:
    """Xóa collection (vectors) của một tài liệu."""
    client = get_chroma_client()
    try:
        client.delete_collection(name=f"doc_{document_id}")
        return True
    except Exception:
        return False


# ============================================================
# LLM GENERATION (Ollama / Gemini)
# ============================================================

def _generate_with_ollama(prompt: str) -> str:
    """Gọi Ollama API (local)."""
    import ollama

    response = ollama.chat(
        model=settings.OLLAMA_MODEL,
        messages=[{"role": "user", "content": prompt}],
        options={"temperature": 0.3}  # Giảm sáng tạo, tăng chính xác
    )
    return response["message"]["content"]


def _generate_with_gemini(prompt: str) -> str:
    """Gọi Google Gemini API (backup)."""
    import google.generativeai as genai

    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(prompt)
    return response.text


def generate_response(prompt: str) -> str:
    """
    Gọi LLM dựa trên cấu hình provider.
    Tự động fallback sang Gemini nếu Ollama lỗi.
    """
    if settings.LLM_PROVIDER == "ollama":
        try:
            return _generate_with_ollama(prompt)
        except Exception as e:
            print(f"[RAG] ⚠️ Ollama lỗi: {e}. Chuyển sang Gemini...")
            if settings.GEMINI_API_KEY:
                return _generate_with_gemini(prompt)
            raise Exception(
                "Ollama không hoạt động và chưa cấu hình Gemini API key. "
                "Hãy chắc chắn Ollama đang chạy (ollama serve) hoặc thêm GEMINI_API_KEY vào .env"
            )
    else:
        return _generate_with_gemini(prompt)


# ============================================================
# RAG PIPELINE (Hạt nhân của hệ thống)
# ============================================================

# Prompt RAG nghiêm ngặt - Ép AI chỉ trả lời từ tài liệu
RAG_SYSTEM_PROMPT = """Bạn là trợ lý học tập AI. Nhiệm vụ TUYỆT ĐỐI của bạn:
1. CHỈ trả lời dựa trên NGỮ CẢNH được cung cấp bên dưới.
2. KHÔNG ĐƯỢC bịa đặt, suy luận, hoặc thêm thông tin từ bên ngoài.
3. Nếu ngữ cảnh KHÔNG chứa câu trả lời → Trả lời: "Không tìm thấy nội dung liên quan trong tài liệu."
4. Trả lời HOÀN TOÀN bằng tiếng Việt.
5. VÀO THẲNG VẤN ĐỀ, không lặp lại câu hỏi tự động, không nói "Xin chào" hoặc "Câu hỏi là:", không thêm chữ "Trả lời:".
6. Trích dẫn số trang khi có thể.

NGỮ CẢNH TỪ TÀI LIỆU:
{context}

CÂU HỎI CỦA NGƯỜI DÙNG:
{question}

TRẢ LỜI:"""


def chat_with_document(
    document_id: str,
    question: str,
    top_k: int = 5
) -> dict:
    """
    RAG Pipeline hoàn chỉnh:
    1. Tìm chunks liên quan (Retrieval)
    2. Xây dựng prompt với context (Augmentation)
    3. Gọi LLM sinh câu trả lời (Generation)

    Returns:
        dict: {
            "answer": "Câu trả lời...",
            "sources": [{"text": "...", "page": "1-2", "score": 0.85}],
            "provider": "ollama"
        }
    """
    # Bước 1: Retrieval - Tìm chunks liên quan
    relevant_chunks = search_relevant_chunks(document_id, question, top_k)

    if not relevant_chunks:
        return {
            "answer": "Không tìm thấy nội dung liên quan trong tài liệu. Hãy thử hỏi câu khác hoặc kiểm tra tài liệu đã được tải lên.",
            "sources": [],
            "provider": settings.LLM_PROVIDER
        }

    # Bước 2: Augmentation - Ghép context
    context_parts = []
    for i, chunk in enumerate(relevant_chunks):
        page_info = f"Trang {chunk['start_page']}"
        if chunk['start_page'] != chunk['end_page']:
            page_info = f"Trang {chunk['start_page']}-{chunk['end_page']}"
        context_parts.append(f"[{page_info}]: {chunk['text']}")

    context = "\n\n---\n\n".join(context_parts)

    # Xây dựng prompt
    prompt = RAG_SYSTEM_PROMPT.format(context=context, question=question)

    # Bước 3: Generation - Gọi LLM
    answer = generate_response(prompt)

    # Chuẩn bị trích dẫn nguồn
    sources = []
    for chunk in relevant_chunks:
        page_str = str(chunk["start_page"])
        if chunk["start_page"] != chunk["end_page"]:
            page_str = f"{chunk['start_page']}-{chunk['end_page']}"
        sources.append({
            "text": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
            "page": page_str,
            "score": round(chunk["score"], 3)
        })

    return {
        "answer": answer,
        "sources": sources,
        "provider": settings.LLM_PROVIDER
    }


# ============================================================
# SUMMARIZATION (Tóm tắt tài liệu)
# ============================================================

SUMMARIZE_PROMPT = """Bạn là trợ lý học tập. Hãy tóm tắt nội dung tài liệu sau thành các ý chính:

YÊU CẦU NGHIÊM NGẶT:
1. Trích xuất 5-10 ý chính quan trọng nhất
2. Liệt kê các từ khóa/thuật ngữ cốt lõi
3. Nếu có công thức quan trọng, giữ nguyên
4. TẤT CẢ đầu mục, tiêu đề (như Tóm tắt, Ý chính) và nội dung thuật ngữ PHẢI viết bằng tiếng Việt 100%. Không sử dụng tiếng Anh trừ khi bắt buộc.
5. Trình bày dạng bullet points rõ ràng.

NỘI DUNG TÀI LIỆU:
{content}

TÓM TẮT (BẰNG TIẾNG VIỆT):"""


def summarize_document(document_id: str) -> dict:
    """Tóm tắt toàn bộ tài liệu bằng LLM."""
    client = get_chroma_client()

    try:
        collection = client.get_collection(name=f"doc_{document_id}")
    except Exception:
        return {"summary": "Không tìm thấy tài liệu.", "provider": settings.LLM_PROVIDER}

    # Lấy tất cả chunks
    all_data = collection.get(include=["documents"])
    all_text = "\n\n".join(all_data["documents"])

    # Giới hạn text để không vượt context window của LLM
    max_chars = 8000
    if len(all_text) > max_chars:
        all_text = all_text[:max_chars] + "\n\n[... tài liệu còn tiếp ...]"

    prompt = SUMMARIZE_PROMPT.format(content=all_text)
    summary = generate_response(prompt)

    return {
        "summary": summary,
        "provider": settings.LLM_PROVIDER
    }
