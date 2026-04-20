import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { FileText, Sparkles, RefreshCw } from 'lucide-react';
import { summarizeDocument } from '../api/client';

export default function SummaryPanel({ documentId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSummarize = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await summarizeDocument(documentId);
      setSummary(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="summary-container">
        <div className="summary-content">
          <div className="summary-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={22} color="var(--accent)" />
              Đang tóm tắt...
            </h2>
          </div>
          <div className="summary-text">
            <div className="skeleton skeleton-text" style={{ width: '90%' }} />
            <div className="skeleton skeleton-text" style={{ width: '75%' }} />
            <div className="skeleton skeleton-text" style={{ width: '85%' }} />
            <div className="skeleton skeleton-text" style={{ width: '60%' }} />
            <div style={{ height: 16 }} />
            <div className="skeleton skeleton-text" style={{ width: '88%' }} />
            <div className="skeleton skeleton-text" style={{ width: '70%' }} />
            <div className="skeleton skeleton-text" style={{ width: '80%' }} />
            <div className="skeleton skeleton-text" style={{ width: '55%' }} />
            <div style={{ height: 16 }} />
            <div className="skeleton skeleton-text" style={{ width: '82%' }} />
            <div className="skeleton skeleton-text" style={{ width: '65%' }} />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="summary-container">
        <div className="summary-empty">
          <div className="empty-state-icon" style={{ background: 'var(--error-bg)' }}>
            <FileText size={28} color="var(--error)" />
          </div>
          <h3 style={{ color: 'var(--error)' }}>Lỗi tóm tắt</h3>
          <p style={{ fontSize: '0.85rem' }}>{error}</p>
          <button className="btn btn-primary" onClick={handleSummarize} style={{ marginTop: 8 }}>
            <RefreshCw size={16} />
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Summary result
  if (summary) {
    return (
      <div className="summary-container" id="summary-panel">
        <div className="summary-content">
          <div className="summary-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={22} color="var(--accent)" />
              Tóm tắt tài liệu
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="badge badge-accent">{summary.provider}</span>
              <button className="btn btn-ghost" onClick={handleSummarize} title="Tóm tắt lại">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
          <div className="summary-text">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{summary.summary}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  // Empty / initial state
  return (
    <div className="summary-container">
      <div className="summary-empty">
        <div className="empty-state-icon">
          <Sparkles size={32} />
        </div>
        <h3>Tóm tắt tài liệu bằng AI</h3>
        <p style={{ fontSize: '0.85rem', maxWidth: 400, textAlign: 'center' }}>
          AI sẽ phân tích và trích xuất các ý chính, từ khóa, và nội dung cốt lõi của tài liệu.
        </p>
        <button
          className="btn btn-primary"
          onClick={handleSummarize}
          style={{ marginTop: 8 }}
          id="summarize-btn"
        >
          <Sparkles size={18} />
          Tạo bản tóm tắt
        </button>
      </div>
    </div>
  );
}
