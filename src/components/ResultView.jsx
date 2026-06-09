import React from 'react';

export default function ResultView({ attempt, onGoHome, onViewLeaderboard }) {
  const { quizTitle, score, totalQuestions, percentage, timeTaken } = attempt;

  // Visual performance indicators
  let titleText = "Calibration Complete";
  let subtitleText = "Keep training to optimize your cognitive capacity.";
  let rankClass = "gradient-text-pink";

  if (percentage >= 90) {
    titleText = "Masterful Accomplishment";
    subtitleText = "Flawless synchronization. You are a legendary trivia pilot.";
    rankClass = "gradient-text";
  } else if (percentage >= 60) {
    titleText = "Successful Completion";
    subtitleText = "Solid performance. Your scoring matrices are optimal.";
    rankClass = "gradient-text";
  }

  return (
    <div style={{ maxWidth: '500px', margin: '60px auto', padding: '20px' }}>
      {/* Title block */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
          MISSION STATUS
        </span>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', fontWeight: '800' }} className={rankClass}>
          {titleText}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.4' }}>
          {subtitleText}
        </p>
      </div>

      {/* Stats Panel */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '1.3rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px', textAlign: 'left' }}>
          {quizTitle}
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', textAlign: 'left' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>SCORE</span>
            <span style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent-cyan)' }}>
              {score} / {totalQuestions}
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>ACCURACY</span>
            <span style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent-blue)' }}>
              {percentage}%
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>DURATION</span>
            <span style={{ fontSize: '1.8rem', fontWeight: '700', color: 'white' }}>
              {timeTaken} seconds
            </span>
          </div>

          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block' }}>PER QUESTION</span>
            <span style={{ fontSize: '1.8rem', fontWeight: '700', color: 'white' }}>
              {totalQuestions > 0 ? (timeTaken / totalQuestions).toFixed(1) : 0}s
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button className="btn-primary glow-active" onClick={onViewLeaderboard}>
          🏆 View Global Leaderboard
        </button>
        <button className="btn-secondary" onClick={onGoHome}>
          🏠 Return to Mission Hub
        </button>
      </div>
    </div>
  );
}
