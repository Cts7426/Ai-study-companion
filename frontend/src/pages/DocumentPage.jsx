import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Sparkles,
  BrainCircuit,
  FileText,
  ArrowLeft,
} from 'lucide-react';
import ChatPanel from '../components/ChatPanel';
import SummaryPanel from '../components/SummaryPanel';
import QuizPanel from '../components/QuizPanel';

export default function DocumentPage({ documents }) {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('chat');

  const doc = documents.find((d) => d.document_id === documentId);

  // If document not found, redirect
  useEffect(() => {
    if (documents.length > 0 && !doc) {
      navigate('/');
    }
  }, [doc, documents, navigate]);

  if (!doc) {
    return (
      <div className="doc-page">
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
        }}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'chat', label: 'Chat Q&A', icon: <MessageSquare size={16} /> },
    { id: 'summary', label: 'Tóm tắt', icon: <Sparkles size={16} /> },
    { id: 'quiz', label: 'Quiz', icon: <BrainCircuit size={16} /> },
  ];

  return (
    <div className="doc-page" id="document-page">
      {/* Header */}
      <div className="doc-page-header">
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => navigate('/')}
          title="Về trang chủ"
        >
          <ArrowLeft size={18} />
        </button>
        <FileText size={18} color="var(--primary-light)" />
        <div className="doc-page-title">{doc.filename}</div>
        <span className="badge badge-primary">{doc.total_pages} trang</span>
        <span className="badge badge-accent">{doc.total_chunks} chunks</span>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
            id={`tab-${tab.id}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'chat' && <ChatPanel documentId={documentId} />}
        {activeTab === 'summary' && <SummaryPanel documentId={documentId} />}
        {activeTab === 'quiz' && <QuizPanel documentId={documentId} />}
      </div>
    </div>
  );
}
