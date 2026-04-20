import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, MessageSquare, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import { chatWithDocument } from '../api/client';

export default function ChatPanel({ documentId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleSend = async () => {
    const question = input.trim();
    if (!question || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatWithDocument(documentId, question);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.answer,
          sources: response.data.sources,
          provider: response.data.provider,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `❌ Lỗi: ${error.message}`,
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (text) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const suggestions = [
    'Tóm tắt nội dung chính',
    'Giải thích khái niệm quan trọng',
    'Liệt kê các ý chính',
    'So sánh các phần trong tài liệu',
  ];

  return (
    <div className="chat-container" id="chat-panel">
      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon">
              <MessageSquare size={28} />
            </div>
            <h3>Hỏi đáp với tài liệu</h3>
            <p style={{ fontSize: '0.85rem', maxWidth: 400, textAlign: 'center' }}>
              AI sẽ trả lời dựa trên nội dung tài liệu bạn đã upload. Hãy đặt câu hỏi!
            </p>
            <div className="chat-suggestions">
              {suggestions.map((s, i) => (
                <button key={i} className="chat-suggestion" onClick={() => handleSuggestion(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))
        )}

        {loading && (
          <div className="message message-assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content">
              <div className="typing-indicator">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-bar">
        <div className="chat-input-wrapper">
          <textarea
            ref={textareaRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu hỏi về tài liệu..."
            rows={1}
            disabled={loading}
            id="chat-input"
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || loading}
            id="chat-send-btn"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Message Bubble Sub-component ---------- */
function MessageBubble({ message }) {
  const [showSources, setShowSources] = useState(false);
  const isUser = message.role === 'user';

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-avatar">{isUser ? '👤' : '🤖'}</div>
      <div>
        <div className="message-content">
          {isUser ? (
            message.content
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          )}
        </div>

        {/* Source citations */}
        {message.sources && message.sources.length > 0 && (
          <>
            <button
              className="sources-toggle"
              onClick={() => setShowSources(!showSources)}
            >
              <BookOpen size={12} />
              {message.sources.length} nguồn tham khảo
              {showSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showSources && (
              <div className="sources-list">
                {message.sources.map((src, i) => (
                  <div key={i} className="source-item">
                    <span className="source-page">Trang {src.page}</span>
                    <span className="source-score">Score: {src.score}</span>
                    <div style={{ marginTop: 4 }}>{src.text}</div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
