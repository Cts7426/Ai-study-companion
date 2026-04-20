import { useState } from 'react';
import {
  BrainCircuit,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Trophy,
  Loader2,
} from 'lucide-react';
import { generateQuiz, submitQuiz } from '../api/client';

// States: idle → generating → taking → submitted
export default function QuizPanel({ documentId }) {
  const [state, setState] = useState('idle'); // idle | generating | taking | submitted
  const [numQuestions, setNumQuestions] = useState(5);
  const [quiz, setQuiz] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Generate quiz
  const handleGenerate = async () => {
    setState('generating');
    setError(null);
    try {
      const response = await generateQuiz(documentId, numQuestions);
      setQuiz(response.data);
      setUserAnswers(new Array(response.data.questions.length).fill(-1));
      setCurrentQ(0);
      setState('taking');
    } catch (err) {
      setError(err.message);
      setState('idle');
    }
  };

  // Select answer
  const selectAnswer = (questionIdx, optionIdx) => {
    if (state !== 'taking') return;
    const newAnswers = [...userAnswers];
    newAnswers[questionIdx] = optionIdx;
    setUserAnswers(newAnswers);
  };

  // Submit quiz
  const handleSubmit = async () => {
    if (userAnswers.some((a) => a === -1)) {
      setError('Vui lòng trả lời tất cả câu hỏi trước khi nộp bài.');
      return;
    }

    setState('generating');
    setError(null);
    try {
      const response = await submitQuiz(quiz.quiz_id, userAnswers);
      setResult(response.data);
      setState('submitted');
    } catch (err) {
      setError(err.message);
      setState('taking');
    }
  };

  // Reset
  const handleReset = () => {
    setQuiz(null);
    setResult(null);
    setUserAnswers([]);
    setCurrentQ(0);
    setError(null);
    setState('idle');
  };

  // ========== IDLE STATE ==========
  if (state === 'idle') {
    return (
      <div className="quiz-container" id="quiz-panel">
        <div className="quiz-start">
          <div className="quiz-start-icon">
            <BrainCircuit size={36} />
          </div>
          <h2>Quiz trắc nghiệm</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: 420, textAlign: 'center' }}>
            AI sẽ tự động tạo bộ câu hỏi trắc nghiệm từ nội dung tài liệu. Kiểm tra kiến thức
            của bạn ngay!
          </p>

          <div className="quiz-config">
            <label>Số câu hỏi:</label>
            <select value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))}>
              <option value={3}>3 câu</option>
              <option value={5}>5 câu</option>
              <option value={8}>8 câu</option>
              <option value={10}>10 câu</option>
            </select>
          </div>

          {error && (
            <p style={{ color: 'var(--error)', fontSize: '0.85rem' }}>❌ {error}</p>
          )}

          <button className="btn btn-primary" onClick={handleGenerate} style={{ marginTop: 8 }}>
            <BrainCircuit size={18} />
            Tạo Quiz
          </button>
        </div>
      </div>
    );
  }

  // ========== GENERATING STATE ==========
  if (state === 'generating') {
    return (
      <div className="quiz-container">
        <div className="quiz-start">
          <div className="quiz-start-icon">
            <div className="spinner" style={{ width: 36, height: 36 }} />
          </div>
          <h2>Đang tạo quiz...</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            AI đang phân tích tài liệu và sinh câu hỏi
          </p>
        </div>
      </div>
    );
  }

  // ========== SUBMITTED STATE (RESULT) ==========
  if (state === 'submitted' && result) {
    const percentage = result.percentage;
    const gradeClass =
      percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : percentage >= 40 ? 'average' : 'poor';
    const gradeEmoji =
      percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : percentage >= 40 ? '📚' : '💪';

    return (
      <div className="quiz-container">
        <div className="quiz-content">
          {/* Score */}
          <div className="quiz-result">
            <div className={`score-circle ${gradeClass}`}>
              <div className="score-value">{percentage}%</div>
              <div className="score-label">
                {result.score}/{result.total} câu đúng
              </div>
            </div>
            <h2 style={{ marginBottom: 8 }}>{gradeEmoji} {
              percentage >= 80 ? 'Xuất sắc!' :
              percentage >= 60 ? 'Khá tốt!' :
              percentage >= 40 ? 'Cần cố gắng thêm' :
              'Hãy ôn lại bài nhé!'
            }</h2>

            <div className="quiz-result-actions">
              <button className="btn btn-secondary" onClick={handleReset}>
                <RotateCcw size={16} />
                Làm quiz mới
              </button>
            </div>
          </div>

          {/* Detailed results */}
          <div style={{ marginTop: 32 }}>
            <h3 style={{ marginBottom: 16 }}>Chi tiết kết quả</h3>
            {result.details.map((detail, idx) => {
              const question = quiz.questions[idx];
              return (
                <div key={idx} className="quiz-question-card" style={{ marginBottom: 16 }}>
                  <div className="quiz-question-number">
                    Câu {idx + 1}
                    {detail.is_correct ? (
                      <CheckCircle
                        size={16}
                        color="var(--success)"
                        style={{ marginLeft: 8, verticalAlign: 'middle' }}
                      />
                    ) : (
                      <XCircle
                        size={16}
                        color="var(--error)"
                        style={{ marginLeft: 8, verticalAlign: 'middle' }}
                      />
                    )}
                  </div>
                  <div className="quiz-question-text">{detail.question}</div>
                  <div className="quiz-options">
                    {question.options.map((opt, oIdx) => {
                      let className = 'quiz-option';
                      if (oIdx === detail.correct_answer) className += ' correct';
                      else if (oIdx === detail.user_answer && !detail.is_correct)
                        className += ' wrong';

                      return (
                        <div key={oIdx} className={className}>
                          <div className="quiz-option-radio" />
                          <span>{opt}</span>
                          {oIdx === detail.correct_answer && (
                            <CheckCircle size={16} color="var(--success)" style={{ marginLeft: 'auto' }} />
                          )}
                          {oIdx === detail.user_answer && !detail.is_correct && (
                            <XCircle size={16} color="var(--error)" style={{ marginLeft: 'auto' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {detail.explanation && (
                    <div className="quiz-explanation">
                      💡 {detail.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ========== TAKING STATE ==========
  if (state === 'taking' && quiz) {
    const questions = quiz.questions;
    const question = questions[currentQ];
    const answeredCount = userAnswers.filter((a) => a !== -1).length;
    const allAnswered = userAnswers.every((a) => a !== -1);

    return (
      <div className="quiz-container">
        <div className="quiz-content">
          {/* Progress */}
          <div className="quiz-progress">
            <div className="quiz-progress-info">
              <span>
                Câu {currentQ + 1} / {questions.length}
              </span>
              <span>{answeredCount} đã trả lời</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {error && (
            <p style={{ color: 'var(--error)', fontSize: '0.85rem', marginBottom: 16 }}>
              ⚠️ {error}
            </p>
          )}

          {/* Question Card */}
          <div className="quiz-question-card">
            <div className="quiz-question-number">Câu hỏi {currentQ + 1}</div>
            <div className="quiz-question-text">{question.question}</div>
            <div className="quiz-options">
              {question.options.map((opt, oIdx) => (
                <div
                  key={oIdx}
                  className={`quiz-option ${userAnswers[currentQ] === oIdx ? 'selected' : ''}`}
                  onClick={() => selectAnswer(currentQ, oIdx)}
                >
                  <div className="quiz-option-radio" />
                  <span>{opt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="quiz-nav">
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
              disabled={currentQ === 0}
            >
              <ArrowLeft size={16} />
              Trước
            </button>

            {/* Question dots */}
            <div style={{ display: 'flex', gap: 6 }}>
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    border: i === currentQ ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background:
                      userAnswers[i] !== -1
                        ? 'hsla(265, 80%, 60%, 0.2)'
                        : 'var(--bg-input)',
                    color:
                      i === currentQ ? 'var(--primary-light)' : 'var(--text-secondary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'inherit',
                    transition: 'all 150ms',
                  }}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {currentQ < questions.length - 1 ? (
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentQ((q) => Math.min(questions.length - 1, q + 1))}
              >
                Sau
                <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={!allAnswered}
              >
                <Trophy size={16} />
                Nộp bài
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
