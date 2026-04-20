"""
AI Study Companion - Backend API Server
Khởi động: uvicorn app.main:app --reload
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup & Shutdown events."""
    # === STARTUP ===
    print("=" * 50)
    print("🚀 AI Study Companion Backend")
    print("=" * 50)

    # Pre-load embedding model (tránh lag lần đầu tiên)
    from app.services.rag_service import get_embedding_model, get_chroma_client
    get_embedding_model()
    get_chroma_client()

    from app.core.config import settings
    print(f"📦 LLM Provider: {settings.LLM_PROVIDER}")
    print(f"🧠 Embedding Model: {settings.EMBEDDING_MODEL}")
    print(f"💾 ChromaDB: {settings.CHROMA_PERSIST_DIR}")
    print("=" * 50)
    print("✅ Server sẵn sàng! Truy cập: http://localhost:8000/docs")
    print("=" * 50)

    yield

    # === SHUTDOWN ===
    print("👋 Server đang tắt...")


app = FastAPI(
    title="AI Study Companion API",
    description="Backend API cho ứng dụng trợ lý học tập AI - Sử dụng RAG để hỏi đáp, tóm tắt, tạo quiz từ tài liệu PDF.",
    version="1.0.0",
    lifespan=lifespan
)

# Cấp phép cho Frontend (Web + Flutter) gọi API mà không bị chặn CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


@app.get("/", tags=["Health"])
def read_root():
    """Health check endpoint."""
    return {
        "status": "success",
        "message": "Backend AI Study Companion đã khởi động!",
        "docs": "/docs"
    }
