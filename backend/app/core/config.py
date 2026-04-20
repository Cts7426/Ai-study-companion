"""
Cấu hình ứng dụng - Load biến môi trường từ file .env
"""
from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Cấu hình trung tâm cho toàn bộ ứng dụng."""

    # === LLM Provider ===
    LLM_PROVIDER: str = "ollama"  # "ollama" hoặc "gemini"

    # Ollama Config
    OLLAMA_MODEL: str = "llama3"
    OLLAMA_BASE_URL: str = "http://localhost:11434"

    # Gemini Config (backup)
    GEMINI_API_KEY: str = ""

    # === Embedding ===
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # === Storage ===
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    UPLOAD_DIR: str = "./uploads"

    # === Chunking ===
    CHUNK_SIZE: int = 500
    CHUNK_OVERLAP: int = 50

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


# Singleton instance - import từ đây để dùng xuyên suốt app
settings = Settings()

# Tạo thư mục nếu chưa tồn tại
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.CHROMA_PERSIST_DIR).mkdir(parents=True, exist_ok=True)
