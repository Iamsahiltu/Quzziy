import { useState } from 'react';
import { getLeaderboard } from '../services/db';

export default function LeaderboardView({ onGoHome }) {
  const [board] = useState(() => getLeaderboard());

  const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];

  return (
    <div className="lb-page">

      {/* ── Header ── */}
      <div className="section-header">
        <h1 className="page-title">Leaderboard Matrix</h1>
        <p className="page-subtitle">Top performing pilots in the network.</p>
      </div>

      {/* ── Table ── */}
      <div className="lb-panel">
        {board.length === 0 ? (
          <p className="lb-empty">No telemetry available.</p>
        ) : (
          <table className="lb-table">
            <thead>
              <tr>
                <th className="lb-th">RANK</th>
                <th className="lb-th">CODENAME</th>
                <th className="lb-th lb-th--center">MISSIONS</th>
                <th className="lb-th lb-th--center">ACCURACY</th>
                <th className="lb-th lb-th--right">SCORE</th>
              </tr>
            </thead>
            <tbody>
              {board.map((user, idx) => {
                const isTop = idx < 3;
                const rankCell = isTop ? (
                  <span
                    className="medal-badge"
                    style={{ background: medalColors[idx], color: '#080c16' }}
                  >
                    {idx + 1}
                  </span>
                ) : (
                  <span className="rank-number">{idx + 1}</span>
                );

                return (
                  <tr key={user.userId || idx} className={idx === 0 ? 'lb-row--gold' : ''}>
                    <td className="lb-td">{rankCell}</td>
                    <td className={`lb-td--name ${idx === 0 ? 'pilot-name' : ''}`}>
                      {user.displayName}
                    </td>
                    <td className="lb-td--center">{user.quizzesCompleted}</td>
                    <td className="lb-td--acc">{user.averagePercentage}%</td>
                    <td className="lb-td--score">{user.totalScore}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <button className="btn-primary" onClick={onGoHome}>🏠 Return to Mission Hub</button>
    </div>
  );
}
