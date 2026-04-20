/**
 * API Client — Kết nối Frontend ↔ Backend FastAPI
 */

const BASE_URL = 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  // Không set Content-Type cho FormData (upload file)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Lỗi kết nối server' }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

// === DOCUMENTS ===

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function getDocuments() {
  return request('/api/documents');
}

export async function deleteDocument(documentId) {
  return request(`/api/documents/${documentId}`, {
    method: 'DELETE',
  });
}

// === CHAT (RAG) ===

export async function chatWithDocument(documentId, question, topK = 5) {
  return request('/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      document_id: documentId,
      question,
      top_k: topK,
    }),
  });
}

// === SUMMARIZE ===

export async function summarizeDocument(documentId) {
  return request(`/api/documents/${documentId}/summarize`, {
    method: 'POST',
  });
}

// === QUIZ ===

export async function generateQuiz(documentId, numQuestions = 5) {
  return request('/api/quiz/generate', {
    method: 'POST',
    body: JSON.stringify({
      document_id: documentId,
      num_questions: numQuestions,
    }),
  });
}

export async function submitQuiz(quizId, userAnswers) {
  return request('/api/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({
      quiz_id: quizId,
      user_answers: userAnswers,
    }),
  });
}

export async function getQuizHistory(documentId = null) {
  const params = documentId ? `?document_id=${documentId}` : '';
  return request(`/api/quiz/history${params}`);
}
