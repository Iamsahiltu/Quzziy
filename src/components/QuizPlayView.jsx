import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { getQuizById, getQuizQuestions, gradeQuizSubmission, saveAttempt } from '../services/db';

export default function QuizPlayView({ displayName, quizId, onFinished, onCancel }) {
  const quiz      = useMemo(() => getQuizById(quizId), [quizId]);
  const questions = useMemo(() => getQuizQuestions(quizId), [quizId]);

  const [currentIdx,  setCurrentIdx]  = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isAnswered,  setIsAnswered]  = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft,    setTimeLeft]    = useState(() => quiz?.timePerQuestion || 30);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [correctReveal,  setCorrectReveal]  = useState(null);

  const timerRef    = useRef(null);
  const startTimeRef = useRef(null);

  const revealCorrect = useCallback((questionId) => {
    const map = JSON.parse(localStorage.getItem('quiz_contest_answers') || '{}');
    setCorrectReveal((map[quizId] || {})[questionId]);
  }, [quizId]);

  const handleTimeout = useCallback(() => {
    setSelectedIdx(-1);
    setIsAnswered(true);
    const q = questions[currentIdx];
    if (q) { setUserAnswers(p => ({ ...p, [q.id]: -1 })); revealCorrect(q.id); }
  }, [currentIdx, questions, revealCorrect]);

  useEffect(() => {
    if (!quiz || questions.length === 0 || isAnswered) return;
    startTimeRef.current = Date.now();

    if (quiz.timePerQuestion > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); handleTimeout(); return 0; }
          return prev - 1;
        });
        setTotalTimeTaken(p => p + 1);
      }, 1000);
    } else {
      timerRef.current = setInterval(() => setTotalTimeTaken(p => p + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [quiz, currentIdx, isAnswered, questions, handleTimeout]);

  const handleSelectOption = (idx) => { if (!isAnswered) setSelectedIdx(idx); };

  const handleSubmitAnswer = () => {
    if (selectedIdx === null) return;
    clearInterval(timerRef.current);
    setIsAnswered(true);
    const q = questions[currentIdx];
    setUserAnswers(p => ({ ...p, [q.id]: selectedIdx }));
    revealCorrect(q.id);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(p => p + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
      setCorrectReveal(null);
      setTimeLeft(quiz?.timePerQuestion || 30);
    } else {
      const grading = gradeQuizSubmission(quizId, userAnswers, totalTimeTaken);
      onFinished(saveAttempt(displayName, quizId, grading));
    }
  };

  if (!quiz || questions.length === 0) {
    return (
      <div className="quiz-loading">
        <p className="quiz-loading-text">Loading parameters…</p>
      </div>
    );
  }

  const currentQuestion  = questions[currentIdx];
  const progressPercent  = Math.round(((currentIdx + 1) / questions.length) * 100);
  const timerClass       = quiz.timePerQuestion > 0
    ? `quiz-timer ${timeLeft <= 5 ? 'quiz-timer--urgent' : 'quiz-timer--safe'}`
    : 'quiz-timer--free';

  return (
    <div className="quiz-play-page">

      {/* ── Header ── */}
      <div className="quiz-play-header">
        <button className="btn-secondary" onClick={onCancel}>Quit</button>
        <span className="quiz-play-counter">Question {currentIdx + 1} of {questions.length}</span>
        {quiz.timePerQuestion > 0
          ? <span className={timerClass}>⏱️ {timeLeft}s</span>
          : <span className="quiz-timer--free">⏱️ Unlimited</span>
        }
      </div>

      {/* ── Progress ── */}
      <div className="progress-bar-container">
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* ── Question ── */}
      <div className="question-panel">
        <h2 className="question-text">{currentQuestion.questionText}</h2>

        <div className="options-list">
          {currentQuestion.options.map((option, idx) => {
            let cls = 'option-button';
            if (isAnswered) {
              if (idx === correctReveal) cls += ' correct';
              else if (idx === selectedIdx) cls += ' wrong';
              else cls += ' disabled';
            }
            return (
              <button
                key={idx}
                className={cls}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                style={selectedIdx === idx && !isAnswered
                  ? { borderColor: 'var(--color-accent-cyan)', backgroundColor: 'rgba(34,211,238,0.1)' }
                  : {}}
              >
                <span>{option}</span>
                {isAnswered && idx === correctReveal && <span>✔️</span>}
                {isAnswered && idx === selectedIdx && idx !== correctReveal && <span>❌</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Footer actions ── */}
      <div className="quiz-play-footer">
        {!isAnswered && selectedIdx !== null && (
          <button className="quiz-submit-btn" onClick={handleSubmitAnswer}>
            ✓ Submit Answer
          </button>
        )}
        {isAnswered && (
          <button className="quiz-next-btn" onClick={handleNext}>
            {currentIdx === questions.length - 1 ? '🏁 Finish Challenge' : '→ Next Question'}
          </button>
        )}
      </div>
    </div>
  );
}
