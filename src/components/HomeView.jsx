import { useState } from 'react';
import { getQuizzes } from '../services/db';

export default function HomeView({ displayName, setDisplayName, onStartQuiz, onViewLeaderboard, onViewAdmin }) {
  const quizzes = getQuizzes();
  const [nameInput, setNameInput] = useState(displayName);
  const [isEditingName, setIsEditingName] = useState(!displayName);

  const handleSaveName = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setDisplayName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', padding: '20px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '3.2rem', margin: '0 0 10px 0', fontWeight: '800' }} className="gradient-text">
          Q.U.Z.Z.I.Y Trivia
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem' }}>
          Unleash your intellect in asynchronous quiz warfare.
        </p>
      </div>

      {/* Profile/Name Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px' }}>
        {isEditingName ? (
          <form onSubmit={handleSaveName} style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
            <label style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: '500', textAlign: 'left' }}>
              ENTER YOUR CODENAME TO BEGIN:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                placeholder="e.g., CyberKnight"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="form-input"
                style={{ flex: 1 }}
                required
              />
              <button type="submit" className="btn-primary">
                Confirm
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', textAlign: 'left' }}>
                ACTIVE PILOT
              </span>
              <span style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
                {displayName}
              </span>
            </div>
            <button className="btn-secondary" onClick={() => setIsEditingName(true)} style={{ padding: '8px 16px' }}>
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Quizzes List */}
      <div style={{ textAlign: 'left' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Available Contests</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '400' }}>
            {quizzes.length} Quizzes Loaded
          </span>
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {quizzes.map(quiz => (
            <div key={quiz.id} className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>{quiz.title}</h3>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  background: quiz.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.15)' : quiz.difficulty === 'hard' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                  color: quiz.difficulty === 'easy' ? '#10b981' : quiz.difficulty === 'hard' ? '#f43f5e' : '#3b82f6',
                  border: `1px solid ${quiz.difficulty === 'easy' ? 'rgba(16, 185, 129, 0.3)' : quiz.difficulty === 'hard' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
                }}>
                  {quiz.difficulty}
                </span>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: '1.45' }}>
                {quiz.description}
              </p>

              <div style={{ display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px', marginTop: '4px' }}>
                <span>📂 {quiz.category}</span>
                <span>⏱️ {quiz.timePerQuestion > 0 ? `${quiz.timePerQuestion}s/question` : 'Unlimited'}</span>
                <span>❓ {quiz.questionCount} Questions</span>
              </div>

              <button
                className="btn-primary glow-active"
                style={{ width: '100%', marginTop: '10px' }}
                onClick={() => onStartQuiz(quiz.id)}
                disabled={isEditingName}
              >
                Launch Mission
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '40px' }}>
        <button className="btn-secondary" onClick={onViewLeaderboard}>
          🏆 Leaderboard
        </button>
        <button className="btn-secondary" onClick={onViewAdmin}>
          ⚙️ Admin Panel
        </button>
      </div>
    </div>
  );
}
