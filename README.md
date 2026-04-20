# 🧠 AI Study Companion

Welcome to the **AI Study Companion**, an intelligent Retrieval-Augmented Generation (RAG) platform designed to revolutionize the way students interact with their learning materials. By leveraging the power of local or cloud LLMs, this platform turns your static PDF documents into dynamic, conversational, and interactive learning modules.

## ✨ Key Features

1. **📄 Intelligent Document Analysis**: Upload any PDF document. The system processes, splits, and embeds the content into a vector database for instantaneous semantic search retrieval.
2. **💬 Context-Aware Q&A (RAG)**: Ask questions about the uploaded document and receive precise, accurate answers that are **strictly sourced** from the text—minimizing AI hallucinations.
3. **📊 One-Click Summarization**: Automatically extract core concepts, bullet points, and essential terminologies to save hours of reading.
4. **🎯 Auto-Generated Quizzes**: Test your knowledge! The AI instantly functions as an examiner, creating a multi-choice quiz directly from the reading material complete with scoring and robust logical explanations.
5. **🎛️ Dynamic Provider Fallback (Dual-LLM)**: Fully localized private data using **Ollama (Llama-3)** or swap seamlessly to blazing-fast cloud intelligence with **Google Gemini**.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: React, Vite, React Router, Lucide Icons. Engineered with a beautiful Dark-mode Glassmorphism UI for premium aesthetic user experience.
- **Backend (API)**: Python FastAPI for ultra-fast asynchronous operations.
- **RAG Engine**: Sentence Transformers (`all-MiniLM-L6-v2`) + PyMuPDF for document parsing.
- **Database**: ChromaDB locally configured.
- **AI Models**: Ollama / Google Gemini API.

---

## 🚀 Getting Started

Follow these steps to set up the app on your local machine:

### 1. Backend Setup

Launch a terminal and navigate to the `backend` folder:
```bash
cd backend
python -m venv venv
# Activating Environment (Windows)
.\venv\Scripts\Activate
# Install requirements
pip install -r requirements.txt
```

**Environment Variables**
Ensure you configure the `.env` file in the `backend` root:
```ini
LLM_PROVIDER=gemini # Or 'ollama'
GEMINI_API_KEY=your_gemini_api_key_here
```

**Run Server**
```bash
uvicorn app.main:app --reload
```
The API server will run at `http://localhost:8000`.

### 2. Frontend Setup

Open a **separate** terminal and run:
```bash
cd frontend
npm install
npm run dev
```

The app is now running! Click the provided Localhost URL across the prompt, upload a cool PDF document, and start exploring.

---

## 💡 Why AI Study Companion?

The era of overwhelming digital text information requires specialized parsing rules. Unlike raw language models like ChatGPT—which often hallucinate when presented with factual nuances unseen in their training data—this bot operates under strict _Retrieval-Augmented constraints_. It forces the AI into a "Read and Answer" mode ensuring highly accurate Vietnamese translations even when digesting complex English material.

Enjoy building your digital memory block!
