import { useState } from 'react';
import { getQuizzes, deleteQuiz } from '../services/db';

export default function HomeView({ displayName, setDisplayName, onStartQuiz, onViewLeaderboard, onViewAdmin }) {
  const [quizzes, setQuizzes]         = useState(() => getQuizzes());
  const [nameInput, setNameInput]     = useState(displayName);
  const [isEditingName, setIsEditingName] = useState(!displayName);

  const handleSaveName = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setDisplayName(nameInput.trim());
      setIsEditingName(false);
    }
  };

  const badgeClass = (d) => `difficulty-badge difficulty-badge--${d}`;

  return (
    <div className="home-page">

      {/* ── Hero ── */}
      <div className="section-header">
        <h1 className="page-title--xl">
          Q.U.Z.Z.I.Y Trivia
        </h1>
        <p className="page-subtitle">Unleash your intellect in asynchronous quiz warfare.</p>
      </div>


      {/* ── Pilot card ── */}
      <div className="pilot-panel">
        {isEditingName ? (
          <form onSubmit={handleSaveName} className="pilot-edit-form">
            <label className="pilot-edit-label">ENTER YOUR CODENAME TO BEGIN:</label>
            <div className="pilot-edit-row">
              <input
                type="text"
                placeholder="e.g., CyberKnight"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="form-input"
                required
              />
              <button type="submit" className="btn-primary">Confirm</button>
            </div>
          </form>
        ) : (
          <div className="pilot-display">
            <div>
              <span className="pilot-label">ACTIVE PILOT</span>
              <span className="pilot-name">{displayName}</span>
            </div>
            <button className="btn-secondary" onClick={() => setIsEditingName(true)}>Edit</button>
          </div>
        )}
      </div>

      {/* ── Quiz list ── */}
      <div>
        <h2 className="quiz-section-title">
          <span>Available Contests</span>
          <span className="quiz-count-label">{quizzes.length} Quizzes Loaded</span>
        </h2>

        <div className="quiz-grid">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="quiz-card">
              <div className="quiz-card-header">
                <h3 className="quiz-card-title">{quiz.title}</h3>
                <span className={badgeClass(quiz.difficulty)}>{quiz.difficulty}</span>
              </div>

              <p className="quiz-card-desc">{quiz.description}</p>

              <div className="quiz-card-meta">
                <span>📂 {quiz.category}</span>
                <span>⏱️ {quiz.timePerQuestion > 0 ? `${quiz.timePerQuestion}s/question` : 'Unlimited'}</span>
                <span>❓ {quiz.questionCount} Questions</span>
              </div>

              <div className="quiz-card-actions">
                <button
                  className="quiz-launch-btn"
                  onClick={() => onStartQuiz(quiz.id)}
                  disabled={isEditingName}
                >
                  Launch Mission
                </button>
                <button
                  className="quiz-delete-btn"
                  onClick={() => {
                    if (!window.confirm('Delete this quiz? This will remove it and its questions.')) return;
                    try { deleteQuiz(quiz.id); setQuizzes(getQuizzes()); }
                    catch (err) { alert('Failed to delete quiz: ' + err.message); }
                  }}
                >
                  Delete Quiz
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Nav ── */}
      <div className="home-nav">
        <button className="btn-secondary" onClick={onViewLeaderboard}>🏆 Leaderboard</button>
        <button className="btn-secondary" onClick={onViewAdmin}>⚙️ Admin Panel</button>
      </div>
    </div>
  );
}
