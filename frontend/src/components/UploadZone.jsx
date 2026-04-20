import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadZone({ onUpload, uploading, uploadResult }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onUpload(acceptedFiles[0]);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`upload-zone ${isDragActive ? 'drag-active' : ''}`}
      id="upload-zone"
    >
      <input {...getInputProps()} id="upload-input" />

      {uploading ? (
        <>
          <div className="upload-icon">
            <div className="spinner" />
          </div>
          <p className="upload-title">Đang xử lý tài liệu...</p>
          <p className="upload-hint">Trích xuất văn bản và tạo vector embeddings</p>
          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '70%' }} />
            </div>
          </div>
        </>
      ) : uploadResult === 'success' ? (
        <>
          <div className="upload-icon" style={{ background: 'hsla(145, 65%, 48%, 0.12)' }}>
            <CheckCircle size={28} color="var(--success)" />
          </div>
          <p className="upload-title" style={{ color: 'var(--success)' }}>
            Upload thành công!
          </p>
          <p className="upload-hint">Nhấn để upload thêm tài liệu khác</p>
        </>
      ) : uploadResult === 'error' ? (
        <>
          <div className="upload-icon" style={{ background: 'var(--error-bg)' }}>
            <AlertCircle size={28} color="var(--error)" />
          </div>
          <p className="upload-title" style={{ color: 'var(--error)' }}>
            Upload thất bại
          </p>
          <p className="upload-hint">Nhấn để thử lại</p>
        </>
      ) : (
        <>
          <div className="upload-icon">
            <Upload size={28} />
          </div>
          <p className="upload-title">
            {isDragActive ? 'Thả file vào đây!' : 'Kéo thả file PDF hoặc nhấn để chọn'}
          </p>
          <p className="upload-hint">Chỉ hỗ trợ file .pdf</p>
        </>
      )}

      {fileRejections.length > 0 && (
        <p style={{ color: 'var(--error)', fontSize: '0.8rem', marginTop: 10 }}>
          Chỉ hỗ trợ file PDF!
        </p>
      )}
    </div>
  );
}
