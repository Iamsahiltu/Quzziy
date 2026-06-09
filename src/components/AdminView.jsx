import React, { useState, useEffect } from 'react';
import { addCustomQuiz, getQuizzes } from '../services/db';

export default function AdminView({ onGoHome }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [amount, setAmount] = useState(10);
  const [isFetching, setIsFetching] = useState(false);
  const [message, setMessage] = useState(null);
  const [quizzesList, setQuizzesList] = useState([]);

  // Fetch categories on mount
  useEffect(() => {
    setQuizzesList(getQuizzes());
    
    fetch('https://opentdb.com/api_category.php')
      .then(res => res.json())
      .then(data => {
        if (data && data.trivia_categories) {
          setCategories(data.trivia_categories);
        }
      })
      .catch(err => {
        console.error("Failed to fetch OpenTDB categories, using fallbacks:", err);
        // Fallback static categories
        setCategories([
          { id: 9, name: "General Knowledge" },
          { id: 11, name: "Entertainment: Film" },
          { id: 18, name: "Science: Computers" },
          { id: 21, name: "Sports" },
          { id: 23, name: "History" }
        ]);
      });
  }, []);

  const decodeHtml = (htmlStr) => {
    const txt = document.createElement("textarea");
    txt.innerHTML = htmlStr;
    return txt.value;
  };

  const handleFetchOpenTDB = async (e) => {
    e.preventDefault();
    setIsFetching(true);
    setMessage({ type: 'info', text: 'Contacting Open Trivia Database...' });

    // Wait 2 seconds to obey rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));

    let url = `https://opentdb.com/api.php?amount=${amount}&difficulty=${selectedDifficulty}&type=multiple`;
    if (selectedCategory) {
      url += `&category=${selectedCategory}`;
    }

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.response_code === 0 && data.results && data.results.length > 0) {
        const results = data.results;
        const categoryName = results[0].category;
        const quizId = `opentdb-${Date.now()}`;

        // Format quiz questions and answers
        const formattedQuestions = [];
        const formattedAnswers = {};

        results.forEach((item, index) => {
          const questionId = `q-${quizId}-${index}`;
          const questionText = decodeHtml(item.question);
          const correctAns = decodeHtml(item.correct_answer);
          const incorrectAns = item.incorrect_answers.map(ans => decodeHtml(ans));

          // Combine and shuffle
          const options = [correctAns, ...incorrectAns];
          // Shuffling options
          for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
          }

          const correctIndex = options.indexOf(correctAns);

          formattedQuestions.push({
            id: questionId,
            questionText: questionText,
            options: options,
            points: 1,
            order: index + 1
          });

          formattedAnswers[questionId] = correctIndex;
        });

        // Quiz metadata
        const newQuiz = {
          id: quizId,
          title: `${categoryName} - ${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} Quiz`,
          description: `Dynamically imported OpenTDB contest.`,
          category: categoryName,
          difficulty: selectedDifficulty,
          timePerQuestion: 25,
          questionCount: formattedQuestions.length,
          isPublished: true,
          createdBy: "web_admin",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          totalAttempts: 0,
          averageScore: 0
        };

        // Save to DB
        addCustomQuiz(newQuiz, formattedQuestions, formattedAnswers);

        setMessage({ type: 'success', text: `Successfully registered: ${newQuiz.title}` });
        setQuizzesList(getQuizzes());
      } else {
        const errorCodes = {
          1: "No results. OpenTDB does not have enough questions for this combination.",
          2: "Invalid Parameters.",
          3: "Session Token not found.",
          4: "Token Empty (Reset needed).",
          5: "Rate limit hit. Try again in 5 seconds."
        };
        const errMsg = errorCodes[data.response_code] || "API returned an empty/error payload.";
        setMessage({ type: 'error', text: `Failed: ${errMsg}` });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Network connection error.' });
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div style={{ maxWidth: '650px', margin: '40px auto', padding: '20px' }}>
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.8rem', margin: '0 0 10px 0', fontWeight: '800' }} className="gradient-text">
          Control Deck
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
          Import telemetry and manage quiz files.
        </p>
      </div>

      {/* Message alerts */}
      {message && (
        <div style={{
          padding: '16px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '0.95rem',
          fontWeight: '500',
          background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : message.type === 'error' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(59, 130, 246, 0.15)',
          color: message.type === 'success' ? '#10b981' : message.type === 'error' ? '#f43f5e' : '#3b82f6',
          border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : message.type === 'error' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(59, 130, 246, 0.3)'}`
        }}>
          {message.text}
        </div>
      )}

      {/* Import Form */}
      <div className="glass-panel" style={{ padding: '28px', marginBottom: '30px', textAlign: 'left' }}>
        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem' }}>Generate Quiz from OpenTDB API</h3>
        
        <form onSubmit={handleFetchOpenTDB} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>CATEGORY</label>
            <select
              className="form-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ background: 'var(--bg-secondary)', color: 'white' }}
              disabled={isFetching}
            >
              <option value="">Any Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>DIFFICULTY</label>
              <select
                className="form-input"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                style={{ background: 'var(--bg-secondary)', color: 'white' }}
                disabled={isFetching}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>QUESTIONS</label>
              <input
                type="number"
                min="5"
                max="30"
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 10)}
                disabled={isFetching}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary glow-active" style={{ marginTop: '10px' }} disabled={isFetching}>
            {isFetching ? 'Processing Telemetry...' : 'Fetch and Register Contest'}
          </button>
        </form>
      </div>

      {/* Active Quizzes List */}
      <div style={{ textAlign: 'left', marginBottom: '40px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '15px' }}>Registered Databases</h3>
        <div className="glass-panel" style={{ padding: '16px' }}>
          {quizzesList.map((q, idx) => (
            <div key={q.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 8px',
              borderBottom: idx === quizzesList.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)'
            }}>
              <div>
                <span style={{ fontWeight: '600', color: 'white', display: 'block' }}>{q.title}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  ID: {q.id} | Attempts: {q.totalAttempts} | Avg: {q.averageScore} pts
                </span>
              </div>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--text-secondary)'
              }}>
                {q.difficulty}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Back button */}
      <button className="btn-secondary" style={{ width: '100%' }} onClick={onGoHome}>
        🏠 Return to Mission Hub
      </button>
    </div>
  );
}
