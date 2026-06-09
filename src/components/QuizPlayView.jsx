import React, { useState, useEffect, useRef } from 'react';
import { getQuizById, getQuizQuestions, gradeQuizSubmission, saveAttempt } from '../services/db';

export default function QuizPlayView({ displayName, quizId, onFinished, onCancel }) {
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(30);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [correctAnswerIndexForReveal, setCorrectAnswerIndexForReveal] = useState(null);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // Load Quiz & Questions
  useEffect(() => {
    const q = getQuizById(quizId);
    const qList = getQuizQuestions(quizId);
    setQuiz(q);
    setQuestions(qList);
    
    if (q) {
      setTimeLeft(q.timePerQuestion || 30);
    }
    
    startTimeRef.current = Date.now();
  }, [quizId]);

  // Handle countdown timer
  useEffect(() => {
    if (!quiz || questions.length === 0 || isAnswered) return;

    if (quiz.timePerQuestion > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
        setTotalTimeTaken(prev => prev + 1);
      }, 1000);
    } else {
      // No limit, just count total time
      timerRef.current = setInterval(() => {
        setTotalTimeTaken(prev => prev + 1);
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [quiz, currentIdx, isAnswered, questions]);

  const handleTimeout = () => {
    // Treat timeout as wrong answer (-1)
    setSelectedIdx(-1);
    setIsAnswered(true);
    
    const currentQuestion = questions[currentIdx];
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: -1
    }));

    // Fetch the correct answer from local secure DB to highlight it
    revealCorrectAnswer(currentQuestion.id);
  };

  const revealCorrectAnswer = (questionId) => {
    // Safely retrieve correct index from storage to show the user what was right
    const answersMap = JSON.parse(localStorage.getItem('quiz_contest_answers') || '{}');
    const quizAnswers = answersMap[quizId] || {};
    setCorrectAnswerIndexForReveal(quizAnswers[questionId]);
  };

  const handleSelectOption = (idx) => {
    if (isAnswered) return;
    clearInterval(timerRef.current);
    setSelectedIdx(idx);
    setIsAnswered(true);

    const currentQuestion = questions[currentIdx];
    setUserAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: idx
    }));

    revealCorrectAnswer(currentQuestion.id);
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
      setCorrectAnswerIndexForReveal(null);
      setTimeLeft(quiz?.timePerQuestion || 30);
    } else {
      // Submit and finish
      const grading = gradeQuizSubmission(quizId, userAnswers, totalTimeTaken);
      const attemptDetails = saveAttempt(displayName, quizId, grading);
      onFinished(attemptDetails);
    }
  };

  if (!quiz || questions.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading parameters...</p>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const progressPercent = Math.round(((currentIdx + 1) / questions.length) * 100);

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button className="btn-secondary" onClick={onCancel} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
          Quit
        </button>
        <span style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--accent-blue)' }}>
          Question {currentIdx + 1} of {questions.length}
        </span>
        {quiz.timePerQuestion > 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '1rem',
            fontWeight: '700',
            color: timeLeft <= 5 ? 'var(--accent-pink)' : 'var(--accent-cyan)'
          }}>
            ⏱️ {timeLeft}s
          </div>
        ) : (
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>⏱️ Unlimited</span>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-bar-container" style={{ marginBottom: '30px' }}>
        <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
      </div>

      {/* Question Card */}
      <div className="glass-panel" style={{ padding: '32px', textAlign: 'left', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.4rem', lineHeight: '1.4', fontWeight: '500', margin: '0 0 24px 0' }}>
          {currentQuestion.questionText}
        </h2>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {currentQuestion.options.map((option, idx) => {
            let btnClass = 'option-button';
            if (isAnswered) {
              if (idx === correctAnswerIndexForReveal) {
                btnClass += ' correct';
              } else if (idx === selectedIdx) {
                btnClass += ' wrong';
              } else {
                btnClass += ' disabled';
              }
            }

            return (
              <button
                key={idx}
                className={btnClass}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
              >
                <span>{option}</span>
                {isAnswered && idx === correctAnswerIndexForReveal && <span>✔️</span>}
                {isAnswered && idx === selectedIdx && idx !== correctAnswerIndexForReveal && <span>❌</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      {isAnswered && (
        <button
          className="btn-primary glow-active"
          onClick={handleNext}
          style={{ width: '100%', padding: '16px' }}
        >
          {currentIdx === questions.length - 1 ? 'Finish Challenge' : 'Next Question'}
        </button>
      )}
    </div>
  );
}
