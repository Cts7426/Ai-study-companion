import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Trash2,
  MessageSquare,
  Sparkles,
  BrainCircuit,
  BookOpen,
} from 'lucide-react';
import UploadZone from '../components/UploadZone';
import { uploadDocument, deleteDocument } from '../api/client';

export default function HomePage({ documents, refreshDocuments }) {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null); // null | 'success' | 'error'

  const handleUpload = async (file) => {
    setUploading(true);
    setUploadResult(null);
    try {
      const response = await uploadDocument(file);
      setUploadResult('success');
      await refreshDocuments();
      // Auto-redirect after 1 second
      setTimeout(() => {
        navigate(`/document/${response.data.document_id}`);
      }, 1000);
    } catch (err) {
      setUploadResult('error');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (docId) => {
    try {
      await deleteDocument(docId);
      await refreshDocuments();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="home-page" id="home-page">
      {/* Hero */}
      <div className="hero">
        <h1 className="hero-title">AI Study Companion</h1>
        <p className="hero-subtitle">
          Upload tài liệu PDF → AI sẽ giúp bạn hỏi đáp, tóm tắt, và kiểm tra kiến thức
          bằng quiz trắc nghiệm tự động.
        </p>
      </div>

      {/* Upload */}
      <UploadZone onUpload={handleUpload} uploading={uploading} uploadResult={uploadResult} />

      {/* Features preview */}
      {documents.length === 0 && (
        <div className="doc-grid" style={{ marginTop: 48 }}>
          <FeatureCard
            icon={<MessageSquare size={24} />}
            title="Hỏi đáp thông minh"
            description="Đặt câu hỏi và nhận câu trả lời chính xác từ tài liệu"
            color="var(--primary)"
            bgColor="hsla(265, 80%, 60%, 0.1)"
          />
          <FeatureCard
            icon={<Sparkles size={24} />}
            title="Tóm tắt AI"
            description="Tự động trích xuất các ý chính và từ khóa quan trọng"
            color="var(--accent)"
            bgColor="hsla(185, 80%, 55%, 0.1)"
          />
          <FeatureCard
            icon={<BrainCircuit size={24} />}
            title="Quiz tự động"
            description="Sinh bộ câu hỏi trắc nghiệm để ôn tập và kiểm tra"
            color="var(--warning)"
            bgColor="hsla(38, 92%, 55%, 0.1)"
          />
        </div>
      )}

      {/* Document list */}
      {documents.length > 0 && (
        <div className="doc-grid">
          {documents.map((doc) => (
            <div
              key={doc.document_id}
              className="glass-card doc-card"
              onClick={() => navigate(`/document/${doc.document_id}`)}
            >
              <div className="doc-card-header">
                <div className="doc-card-icon">
                  <FileText size={20} />
                </div>
                <div className="doc-card-info">
                  <div className="doc-card-name" title={doc.filename}>
                    {doc.filename}
                  </div>
                  <div className="doc-card-meta">
                    {doc.total_pages} trang · {doc.total_chunks} chunks
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <span className="badge badge-primary">
                  <MessageSquare size={10} /> Chat
                </span>
                <span className="badge badge-accent">
                  <Sparkles size={10} /> Tóm tắt
                </span>
                <span className="badge badge-warning">
                  <BrainCircuit size={10} /> Quiz
                </span>
              </div>

              <button
                className="btn btn-danger btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Xóa "${doc.filename}"?`)) {
                    handleDelete(doc.document_id);
                  }
                }}
                style={{ position: 'absolute', top: 12, right: 12, opacity: 0.6 }}
                title="Xóa"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Feature preview card */
function FeatureCard({ icon, title, description, color, bgColor }) {
  return (
    <div className="glass-card" style={{ padding: 24, cursor: 'default' }}>
      <div
        style={{
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: bgColor,
          borderRadius: 'var(--radius-md)',
          color: color,
          marginBottom: 14,
        }}
      >
        {icon}
      </div>
      <h3 style={{ fontSize: '1rem', marginBottom: 6 }}>{title}</h3>
      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  );
}
