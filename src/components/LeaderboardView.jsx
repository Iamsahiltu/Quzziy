import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/db';

export default function LeaderboardView({ onGoHome }) {
  const [board, setBoard] = useState([]);

  useEffect(() => {
    setBoard(getLeaderboard());
  }, []);

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.8rem', margin: '0 0 10px 0', fontWeight: '800' }} className="gradient-text">
          Leaderboard Matrix
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Top performing pilots in the network.
        </p>
      </div>

      {/* Leaderboard Table */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px', overflowX: 'auto' }}>
        {board.length === 0 ? (
          <p style={{ padding: '20px', color: 'var(--text-secondary)' }}>No telemetry available.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px 8px' }}>RANK</th>
                <th style={{ padding: '12px 8px' }}>CODENAME</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>MISSIONS</th>
                <th style={{ padding: '12px 8px', textAlign: 'center' }}>ACCURACY</th>
                <th style={{ padding: '12px 8px', textAlign: 'right' }}>SCORE</th>
              </tr>
            </thead>
            <tbody>
              {board.map((user, idx) => {
                const isTopThree = idx < 3;
                const medalColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
                const rankDisplay = isTopThree ? (
                  <span style={{
                    display: 'inline-flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: medalColors[idx],
                    color: '#080c16',
                    fontWeight: '700',
                    fontSize: '0.8rem'
                  }}>
                    {idx + 1}
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontWeight: '500', paddingLeft: '8px' }}>
                    {idx + 1}
                  </span>
                );

                return (
                  <tr key={user.userId || idx} style={{
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                    background: idx === 0 ? 'rgba(0, 242, 254, 0.02)' : 'transparent'
                  }}>
                    <td style={{ padding: '16px 8px' }}>{rankDisplay}</td>
                    <td style={{ padding: '16px 8px', fontWeight: '600', color: idx === 0 ? 'var(--accent-cyan)' : 'white' }}>
                      {user.displayName}
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      {user.quizzesCompleted}
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'center', fontWeight: '500', color: 'var(--accent-blue)' }}>
                      {user.averagePercentage}%
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: '700', color: 'white' }}>
                      {user.totalScore}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Action */}
      <button className="btn-primary" style={{ width: '100%' }} onClick={onGoHome}>
        🏠 Return to Mission Hub
      </button>
    </div>
  );
}
