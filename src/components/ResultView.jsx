export default function ResultView({ attempt, onGoHome, onViewLeaderboard }) {
  const { quizTitle, score, totalQuestions, percentage, timeTaken } = attempt;

  let titleText    = 'Calibration Complete';
  let subtitleText = 'Keep training to optimize your cognitive capacity.';
  let titleClass   = 'result-title gradient-text-pink';

  if (percentage >= 90) {
    titleText    = 'Masterful Accomplishment';
    subtitleText = 'Flawless synchronization. You are a legendary trivia pilot.';
    titleClass   = 'result-title gradient-text';
  } else if (percentage >= 60) {
    titleText    = 'Successful Completion';
    subtitleText = 'Solid performance. Your scoring matrices are optimal.';
    titleClass   = 'result-title gradient-text';
  }

  const avgPerQ = totalQuestions > 0 ? (timeTaken / totalQuestions).toFixed(1) : 0;

  return (
    <div className="result-page">

      {/* ── Header ── */}
      <div className="result-header">
        <span className="result-status-label">MISSION STATUS</span>
        <h1 className={titleClass}>{titleText}</h1>
        <p className="result-subtitle">{subtitleText}</p>
      </div>

      {/* ── Stats panel ── */}
      <div className="result-panel">
        <h3 className="result-panel-title">{quizTitle}</h3>

        <div className="result-stats">
          <div>
            <span className="result-stat-label">SCORE</span>
            <span className="result-val--cyan">{score} / {totalQuestions}</span>
          </div>
          <div>
            <span className="result-stat-label">ACCURACY</span>
            <span className="result-val--blue">{percentage}%</span>
          </div>
          <div>
            <span className="result-stat-label">DURATION</span>
            <span className="result-val--plain">{timeTaken} seconds</span>
          </div>
          <div>
            <span className="result-stat-label">PER QUESTION</span>
            <span className="result-val--plain">{avgPerQ}s</span>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="result-actions">
        <button className="btn-primary glow-active" onClick={onViewLeaderboard}>🏆 View Global Leaderboard</button>
        <button className="btn-secondary"           onClick={onGoHome}>🏠 Return to Mission Hub</button>
      </div>
    </div>
  );
}
