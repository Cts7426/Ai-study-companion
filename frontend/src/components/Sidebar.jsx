import { NavLink, useNavigate } from 'react-router-dom';
import {
  FileText,
  Home,
  Trash2,
  Plus,
  BookOpen,
  GraduationCap,
} from 'lucide-react';

export default function Sidebar({ documents, onDelete, onUploadClick }) {
  const navigate = useNavigate();

  return (
    <aside className="sidebar" id="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <NavLink to="/" className="sidebar-logo">
          <span className="logo-icon">🧠</span>
          <div>
            <div>AI Study</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 400, color: 'var(--text-muted)' }}>
              Companion
            </div>
          </div>
        </NavLink>
      </div>

      {/* Navigation */}
      <div className="sidebar-content">
        <div className="sidebar-section-title">Menu</div>

        <NavLink
          to="/"
          className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
          end
        >
          <Home size={18} />
          <span className="doc-name">Trang chủ</span>
        </NavLink>

        {/* Documents list */}
        <div className="sidebar-section-title" style={{ marginTop: 16 }}>
          Tài liệu ({documents.length})
        </div>

        {documents.length === 0 ? (
          <div style={{ padding: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Chưa có tài liệu nào
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.document_id} style={{ position: 'relative' }}>
              <NavLink
                to={`/document/${doc.document_id}`}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              >
                <FileText size={16} />
                <span className="doc-name" title={doc.filename}>
                  {doc.filename}
                </span>
                <span className="doc-pages">{doc.total_pages}p</span>
              </NavLink>
              <button
                className="btn btn-icon btn-ghost"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm(`Xóa "${doc.filename}"?`)) {
                    onDelete(doc.document_id);
                  }
                }}
                style={{
                  position: 'absolute',
                  right: 4,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  opacity: 0.4,
                  padding: 4,
                }}
                title="Xóa tài liệu"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={onUploadClick}>
          <Plus size={18} />
          Upload PDF
        </button>
      </div>
    </aside>
  );
}
