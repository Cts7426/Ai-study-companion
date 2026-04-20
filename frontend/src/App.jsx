import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import DocumentPage from './pages/DocumentPage';
import { getDocuments, deleteDocument } from './api/client';
import './index.css';

function AppContent() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshDocuments = useCallback(async () => {
    try {
      const response = await getDocuments();
      setDocuments(response.data.documents);
    } catch (err) {
      console.error('Không thể kết nối backend:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshDocuments();
  }, [refreshDocuments]);

  const handleDelete = async (docId) => {
    try {
      await deleteDocument(docId);
      await refreshDocuments();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        documents={documents}
        onDelete={handleDelete}
        onUploadClick={() => navigate('/')}
      />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage documents={documents} refreshDocuments={refreshDocuments} />
            }
          />
          <Route
            path="/document/:documentId"
            element={<DocumentPage documents={documents} />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
