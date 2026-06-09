import { useState, useEffect } from 'react';
import HomeView      from './components/HomeView';
import QuizPlayView  from './components/QuizPlayView';
import ResultView    from './components/ResultView';
import LeaderboardView from './components/LeaderboardView';
import AdminView     from './components/AdminView';
import AdminAuth     from './components/AdminAuth';
import ThemeToggle   from './components/ThemeToggle';
import { initializeLocalDB } from './services/db';

export default function App() {
  const [displayName, setDisplayName]   = useState(() => localStorage.getItem('quiz_pilot_name') || '');
  const [currentView, setCurrentView]   = useState('home');
  const [activeQuizId, setActiveQuizId] = useState(null);
  const [lastAttempt, setLastAttempt]   = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => { initializeLocalDB(); }, []);

  useEffect(() => {
    if (displayName) localStorage.setItem('quiz_pilot_name', displayName);
  }, [displayName]);

  const handleStartQuiz    = (quizId) => { setActiveQuizId(quizId); setCurrentView('play'); };
  const handleQuizFinished = (attempt) => { setLastAttempt(attempt); setCurrentView('result'); };

  return (
    <div className="pb-16">
      {/* ── Fixed theme toggle ── */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
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
          key={activeQuizId}
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
        <LeaderboardView onGoHome={() => setCurrentView('home')} />
      )}

      {currentView === 'admin' && (
        !isAdminAuthenticated
          ? <AdminAuth onAuthenticated={() => setIsAdminAuthenticated(true)} />
          : <AdminView onGoHome={() => { setCurrentView('home'); setIsAdminAuthenticated(false); }} />
      )}
    </div>
  );
}
