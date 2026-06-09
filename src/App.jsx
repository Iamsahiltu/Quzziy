import React, { useState, useEffect } from 'react';
import HomeView from './components/HomeView';
import QuizPlayView from './components/QuizPlayView';
import ResultView from './components/ResultView';
import LeaderboardView from './components/LeaderboardView';
import AdminView from './components/AdminView';
import { initializeLocalDB } from './services/db';

export default function App() {
  const [displayName, setDisplayName] = useState(() => {
    return localStorage.getItem('quiz_pilot_name') || '';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('quiz_theme') || 'dark';
  });
  const [currentView, setCurrentView] = useState('home'); // home | play | result | leaderboard | admin
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [lastAttempt, setLastAttempt] = useState(null);

  // Initialize DB on load
  useEffect(() => {
    initializeLocalDB();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light');
    document.body.classList.toggle('theme-dark', theme === 'dark');
    localStorage.setItem('quiz_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((value) => (value === 'dark' ? 'light' : 'dark'));
  };

  // Sync pilot name
  useEffect(() => {
    if (displayName) {
      localStorage.setItem('quiz_pilot_name', displayName);
    }
  }, [displayName]);

  const handleStartQuiz = (quizId) => {
    setActiveQuizId(quizId);
    setCurrentView('play');
  };

  const handleQuizFinished = (attemptDetails) => {
    setLastAttempt(attemptDetails);
    setCurrentView('result');
  };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <div style={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
        <button className="btn-secondary" onClick={toggleTheme} style={{ fontSize: '0.85rem', padding: '10px 16px' }}>
          Switch to {theme === 'dark' ? 'Light' : 'Dark'} Theme
        </button>
      </div>

      {currentView === 'home' && (
        <HomeView
          displayName={displayName}
          setDisplayName={setDisplayName}
          onStartQuiz={handleStartQuiz}
          onViewLeaderboard={() => setCurrentView('leaderboard')}
          onViewAdmin={() => setCurrentView('admin')}
        />
      )}

      {currentView === 'play' && (
        <QuizPlayView
          displayName={displayName}
          quizId={activeQuizId}
          onFinished={handleQuizFinished}
          onCancel={() => setCurrentView('home')}
        />
      )}

      {currentView === 'result' && (
        <ResultView
          attempt={lastAttempt}
          onGoHome={() => setCurrentView('home')}
          onViewLeaderboard={() => setCurrentView('leaderboard')}
        />
      )}

      {currentView === 'leaderboard' && (
        <LeaderboardView
          onGoHome={() => setCurrentView('home')}
        />
      )}

      {currentView === 'admin' && (
        <AdminView
          onGoHome={() => setCurrentView('home')}
        />
      )}
    </div>
  );
}
