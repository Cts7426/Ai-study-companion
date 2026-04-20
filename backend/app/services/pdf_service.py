"""
PDF Service - Bóc tách văn bản và chia nhỏ tài liệu (Chunking)
"""
import fitz  # PyMuPDF
import uuid
import os
import shutil
from pathlib import Path
from typing import Optional
from app.core.config import settings


def extract_text_from_pdf(file_path: str) -> list[dict]:
    """
    Bóc tách text từ file PDF, giữ metadata từng trang.

    Returns:
        List[dict]: [{"page": 1, "text": "..."}, ...]
    """
    doc = fitz.open(file_path)
    pages = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text("text").strip()
        if text:
            pages.append({
                "page": page_num + 1,
                "text": text
            })

    doc.close()
    return pages


def chunk_text(
    pages: list[dict],
    chunk_size: int = None,
    chunk_overlap: int = None
) -> list[dict]:
    """
    Chia text thành các đoạn nhỏ (chunks) có overlap để giữ ngữ cảnh.

    Thuật toán:
    1. Ghép toàn bộ text các trang (giữ đánh dấu trang)
    2. Chia theo số ký tự (chunk_size) với phần chồng lấp (overlap)
    3. Mỗi chunk giữ metadata: trang bắt đầu, trang kết thúc

    Returns:
        List[dict]: [{"chunk_id": "...", "text": "...", "start_page": 1, "end_page": 2}, ...]
    """
    if chunk_size is None:
        chunk_size = settings.CHUNK_SIZE
    if chunk_overlap is None:
        chunk_overlap = settings.CHUNK_OVERLAP

    # Tạo danh sách (text, page_number) cho từng ký tự
    char_page_map = []
    for page_data in pages:
        page_num = page_data["page"]
        for char in page_data["text"]:
            char_page_map.append((char, page_num))
        # Thêm khoảng trắng giữa các trang
        char_page_map.append(("\n", page_num))

    if not char_page_map:
        return []

    chunks = []
    start = 0

    while start < len(char_page_map):
        end = min(start + chunk_size, len(char_page_map))

        # Lấy text của chunk
        chunk_text = "".join([c[0] for c in char_page_map[start:end]]).strip()

        if chunk_text:
            # Xác định trang bắt đầu và kết thúc của chunk
            start_page = char_page_map[start][1]
            end_page = char_page_map[end - 1][1]

            chunks.append({
                "chunk_id": str(uuid.uuid4()),
                "text": chunk_text,
                "start_page": start_page,
                "end_page": end_page
            })

        # Di chuyển con trỏ với overlap
        start += chunk_size - chunk_overlap

    return chunks


def process_pdf(file_path: str, document_id: str) -> dict:
    """
    Pipeline xử lý PDF hoàn chỉnh:
    1. Bóc tách text theo trang
    2. Chia thành chunks
    3. Trả về kết quả để lưu vào Vector DB

    Returns:
        dict: {"document_id", "total_pages", "total_chunks", "chunks": [...]}
    """
    # Bước 1: Extract text
    pages = extract_text_from_pdf(file_path)

    if not pages:
        raise ValueError("Không thể trích xuất văn bản từ file PDF. File có thể là ảnh scan.")

    # Bước 2: Chunking
    chunks = chunk_text(pages)

    # Gắn document_id vào mỗi chunk
    for chunk in chunks:
        chunk["document_id"] = document_id

    return {
        "document_id": document_id,
        "total_pages": len(pages),
        "total_chunks": len(chunks),
        "chunks": chunks
    }


def save_uploaded_file(file_content: bytes, filename: str) -> tuple[str, str]:
    """
    Lưu file upload vào thư mục uploads/.

    Returns:
        tuple: (document_id, file_path)
    """
    document_id = str(uuid.uuid4())
    # Tạo tên file an toàn
    safe_filename = f"{document_id}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(file_content)

    return document_id, file_path


def delete_document_file(document_id: str) -> bool:
    """Xóa file PDF đã upload dựa trên document_id."""
    upload_dir = settings.UPLOAD_DIR
    for filename in os.listdir(upload_dir):
        if filename.startswith(document_id):
            os.remove(os.path.join(upload_dir, filename))
            return True
    return False
