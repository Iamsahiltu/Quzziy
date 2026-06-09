import { useState, useEffect } from 'react';
import {
  addCustomQuiz, getQuizzes, addCustomQuestionToQuiz,
  deleteQuestionFromQuiz, getQuizQuestions, getQuizById,
  deleteQuiz, updateQuizTime
} from '../services/db';

export default function AdminView({ onGoHome }) {
  const [categories,        setCategories]        = useState([]);
  const [selectedCategory,  setSelectedCategory]  = useState('');
  const [selectedDifficulty,setSelectedDifficulty]= useState('medium');
  const [amount,            setAmount]            = useState(10);
  const [isFetching,        setIsFetching]        = useState(false);
  const [message,           setMessage]           = useState(null);
  const [quizzesList,       setQuizzesList]       = useState(() => getQuizzes());
  const [timeInputs,        setTimeInputs]        = useState({});
  const [randomQuizId,      setRandomQuizId]      = useState(() => getQuizzes()[0]?.id || '');
  const [randomQuestion,    setRandomQuestion]    = useState(null);
  const [randomQuizSource,  setRandomQuizSource]  = useState(null);
  const [isLoadingRandom,   setIsLoadingRandom]   = useState(false);

  const [showCustomForm,       setShowCustomForm]       = useState(false);
  const [selectedQuizForCustom,setSelectedQuizForCustom]= useState('');
  const [customQuestion,       setCustomQuestion]       = useState('');
  const [customOptions,        setCustomOptions]        = useState(['', '', '', '']);
  const [correctAnswerIdx,     setCorrectAnswerIdx]     = useState(0);
  const [isAddingQuestion,     setIsAddingQuestion]     = useState(false);

  const [expandedQuizId, setExpandedQuizId] = useState(null);
  const [quizQuestions,  setQuizQuestions]  = useState({});

  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileQuizId,      setFileQuizId]      = useState('');

  /* ── Fetch categories ── */
  useEffect(() => {
    fetch('https://opentdb.com/api_category.php')
      .then(r => r.json())
      .then(d => { if (d?.trivia_categories) setCategories(d.trivia_categories); })
      .catch(() => setCategories([
        { id: 9,  name: 'General Knowledge' },
        { id: 11, name: 'Entertainment: Film' },
        { id: 18, name: 'Science: Computers' },
        { id: 21, name: 'Sports' },
        { id: 23, name: 'History' },
      ]));
  }, []);

  /* ── Helpers ── */
  const decodeHtml = (s) => { const t = document.createElement('textarea'); t.innerHTML = s; return t.value; };
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const msgClass = (t) => `status-msg status-msg--${t}`;

  /* ── Random question from local quiz ── */
  const handleShowRandomFromQuiz = () => {
    const id = randomQuizId || quizzesList[0]?.id;
    if (!id) { setMessage({ type: 'error', text: 'Please create or select a quiz first.' }); return; }
    const qs = getQuizQuestions(id);
    if (!qs.length) { setMessage({ type: 'error', text: 'Selected quiz has no questions yet.' }); return; }
    setRandomQuestion({ ...qs[Math.floor(Math.random() * qs.length)], source: 'quiz' });
    setRandomQuizSource('quiz');
  };

  /* ── Random question from API ── */
  const handleFetchRandomApi = async () => {
    setIsLoadingRandom(true); setMessage(null);
    try {
      const res  = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
      const data = await res.json();
      const item = data.results?.[0];
      if (!item) throw new Error('No random question returned.');
      const correct  = decodeHtml(item.correct_answer);
      const options  = shuffle([correct, ...item.incorrect_answers.map(decodeHtml)]);
      setRandomQuestion({ id: `api-${Date.now()}`, questionText: decodeHtml(item.question),
        options, correctIndex: options.indexOf(correct), category: item.category,
        difficulty: item.difficulty, source: 'api' });
      setRandomQuizSource('api');
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to fetch random question: ${err.message}` });
    } finally { setIsLoadingRandom(false); }
  };

  /* ── Fetch from OpenTDB ── */
  const handleFetchOpenTDB = async (e) => {
    e.preventDefault(); setIsFetching(true);
    setMessage({ type: 'info', text: 'Contacting Open Trivia Database…' });
    await new Promise(r => setTimeout(r, 2000));

    let url = `https://opentdb.com/api.php?amount=${amount}&difficulty=${selectedDifficulty}&type=multiple`;
    if (selectedCategory) url += `&category=${selectedCategory}`;

    try {
      const res  = await fetch(url);
      const data = await res.json();
      if (data.response_code === 0 && data.results?.length) {
        const results = data.results;
        const catName = results[0].category;
        const quizId  = `opentdb-${Date.now()}`;
        const formattedQuestions = [];
        const formattedAnswers   = {};
        results.forEach((item, i) => {
          const qId     = `q-${quizId}-${i}`;
          const correct = decodeHtml(item.correct_answer);
          const opts    = shuffle([correct, ...item.incorrect_answers.map(decodeHtml)]);
          formattedQuestions.push({ id: qId, questionText: decodeHtml(item.question), options: opts, points: 1, order: i + 1 });
          formattedAnswers[qId] = opts.indexOf(correct);
        });
        const newQuiz = {
          id: quizId,
          title: `${catName} - ${selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} Quiz`,
          description: 'Dynamically imported OpenTDB contest.',
          category: catName, difficulty: selectedDifficulty,
          timePerQuestion: 25, questionCount: formattedQuestions.length,
          isPublished: true, createdBy: 'web_admin',
          createdAt: Date.now(), updatedAt: Date.now(), totalAttempts: 0, averageScore: 0,
        };
        addCustomQuiz(newQuiz, formattedQuestions, formattedAnswers);
        setMessage({ type: 'success', text: `Successfully registered: ${newQuiz.title}` });
        setQuizzesList(getQuizzes());
      } else {
        const codes = { 1:'No results for this combination.',2:'Invalid parameters.',3:'Token not found.',4:'Token empty.',5:'Rate limit — try again in 5s.' };
        setMessage({ type: 'error', text: `Failed: ${codes[data.response_code] || 'Unknown error.'}` });
      }
    } catch { setMessage({ type: 'error', text: 'Network error.' }); }
    finally   { setIsFetching(false); }
  };

  /* ── Add custom question ── */
  const handleAddCustomQuestion = (e) => {
    e.preventDefault();
    if (!selectedQuizForCustom) { setMessage({ type: 'error', text: 'Please select a quiz.' }); return; }
    if (!customQuestion.trim()) { setMessage({ type: 'error', text: 'Please enter the question text.' }); return; }
    if (customOptions.some(o => !o.trim())) { setMessage({ type: 'error', text: 'All options must be filled.' }); return; }
    setIsAddingQuestion(true);
    try {
      const result = addCustomQuestionToQuiz(selectedQuizForCustom, customQuestion.trim(), customOptions.map(o => o.trim()), correctAnswerIdx);
      setMessage({ type: 'success', text: `Question added! Quiz now has ${result.quiz.questionCount} questions.` });
      setCustomQuestion(''); setCustomOptions(['', '', '', '']); setCorrectAnswerIdx(0); setShowCustomForm(false);
      setQuizzesList(getQuizzes());
    } catch (err) { setMessage({ type: 'error', text: `Failed: ${err.message}` }); }
    finally { setIsAddingQuestion(false); }
  };

  /* ── Delete question ── */
  const handleDeleteQuestion = (quizId, questionId) => {
    try {
      const result = deleteQuestionFromQuiz(quizId, questionId);
      setMessage({ type: 'success', text: `Question deleted! Quiz now has ${result.quiz.questionCount} questions.` });
      setQuizQuestions({ ...quizQuestions, [quizId]: getQuizQuestions(quizId) });
      setQuizzesList(getQuizzes());
    } catch (err) { setMessage({ type: 'error', text: err.message }); }
  };

  /* ── Toggle quiz expand ── */
  const toggleExpand = (quizId) => {
    if (expandedQuizId === quizId) { setExpandedQuizId(null); }
    else { setExpandedQuizId(quizId); setQuizQuestions({ ...quizQuestions, [quizId]: getQuizQuestions(quizId) }); }
  };

  /* ── Time update ── */
  const handleUpdateTime = (quizId) => {
    const val = Number(timeInputs[quizId] ?? getQuizById(quizId)?.timePerQuestion ?? 0);
    try { updateQuizTime(quizId, val); setQuizzesList(getQuizzes()); setMessage({ type: 'success', text: `Time set to ${val}s` }); }
    catch (err) { setMessage({ type: 'error', text: `Failed: ${err.message}` }); }
  };

  /* ── Delete quiz ── */
  const handleDeleteQuiz = (quizId) => {
    if (!window.confirm('Delete this quiz and all its questions? This cannot be undone.')) return;
    try {
      deleteQuiz(quizId); setQuizzesList(getQuizzes());
      setMessage({ type: 'success', text: 'Quiz deleted.' });
      if (expandedQuizId === quizId) setExpandedQuizId(null);
    } catch (err) { setMessage({ type: 'error', text: `Failed: ${err.message}` }); }
  };

  /* ── File upload ── */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!fileQuizId) { setMessage({ type: 'error', text: 'Please select a quiz first.' }); return; }
    setIsUploadingFile(true);
    try {
      const text = await file.text();
      let questionsData = [];
      if (file.name.endsWith('.json')) {
        const json = JSON.parse(text);
        questionsData = Array.isArray(json) ? json : json.questions || [];
      } else if (file.name.endsWith('.csv')) {
        const lines   = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        for (let i = 1; i < lines.length; i++) {
          const vals = lines[i].split(',').map(v => v.trim());
          const obj  = {};
          headers.forEach((h, idx) => {
            if (h.startsWith('option')) { obj.options = [...(obj.options || []), vals[idx]]; }
            else { obj[h] = vals[idx]; }
          });
          if (obj.question || obj.questiontext) questionsData.push(obj);
        }
      } else throw new Error('Unsupported format. Use JSON or CSV.');

      const cur = getQuizById(fileQuizId);
      const curCount = cur.questionCount || 0;
      const MAX = 199;
      const toAdd = questionsData.filter(q =>
        (q.question || q.questiontext) && (q.options || q.answers) &&
        (q.correctanswer !== undefined || q.correct !== undefined)
      );
      if (curCount >= MAX) {
        setMessage({ type: 'error', text: `Quiz already at ${MAX} question limit.` });
        setIsUploadingFile(false); e.target.value = ''; return;
      }
      const slots = MAX - curCount;
      if (toAdd.length > slots) {
        setMessage({ type: 'error', text: `Only ${slots} slots left. File has ${toAdd.length} questions.` });
        setIsUploadingFile(false); e.target.value = ''; return;
      }
      let ok = 0, fail = 0;
      for (const q of toAdd) {
        try {
          const qText = q.question || q.questiontext || '';
          const opts  = q.options || q.answers || [];
          const ci    = parseInt(q.correctanswer || q.correct || 0);
          if (!qText.trim() || opts.length < 2) { fail++; continue; }
          addCustomQuestionToQuiz(fileQuizId, qText, opts, ci); ok++;
        } catch { fail++; }
      }
      setMessage({ type: 'success', text: `✓ Imported ${ok} questions!${fail > 0 ? ` (${fail} failed)` : ''}` });
      setQuizzesList(getQuizzes());
      setQuizQuestions({ ...quizQuestions, [fileQuizId]: getQuizQuestions(fileQuizId) });
      setFileQuizId(''); e.target.value = '';
    } catch (err) { setMessage({ type: 'error', text: `❌ Failed to parse file: ${err.message}` }); }
    finally { setIsUploadingFile(false); }
  };

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <div className="admin-page">

      {/* ── Page header ── */}
      <div className="section-header">
        <h1 className="page-title">Control Deck</h1>
        <p className="page-subtitle">Import telemetry and manage quiz files.</p>
      </div>

      {/* ── Status message ── */}
      {message && <div className={msgClass(message.type)}>{message.text}</div>}

      {/* ══ Random Question Preview ══ */}
      <div className="admin-panel--tall">
        <h3 className="admin-panel-title">Random Question Preview</h3>

        <div className="admin-two-col">
          <div className="admin-field">
            <label className="admin-field-label">LOCAL QUIZ</label>
            <select className="form-input" value={randomQuizId} onChange={e => setRandomQuizId(e.target.value)}>
              <option value="">Select a quiz</option>
              {quizzesList.map(q => <option key={q.id} value={q.id}>{q.title}</option>)}
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-field-label">API SOURCE</label>
            <button type="button" className="btn-secondary" onClick={handleFetchRandomApi} disabled={isLoadingRandom}>
              {isLoadingRandom ? 'Loading…' : 'Fetch Random API Question'}
            </button>
          </div>
        </div>

        <div className="admin-form-actions">
          <button type="button" className="btn-primary glow-active" onClick={handleShowRandomFromQuiz}>
            Show Random Local Question
          </button>
          <button type="button" className="btn-secondary" onClick={() => { setRandomQuestion(null); setRandomQuizSource(null); }}>
            Clear Preview
          </button>
        </div>

        {randomQuestion && (
          <div className="preview-divider">
            <div className="preview-meta-row">
              <span className="preview-source">Source: {randomQuizSource === 'api' ? 'OpenTDB API' : 'Local Quiz'}</span>
              {randomQuestion.category && <span className="preview-category">{randomQuestion.category}</span>}
            </div>
            <h4 className="preview-q-text">{randomQuestion.questionText || randomQuestion.question}</h4>
            <div className="preview-options">
              {(randomQuestion.options || []).map((opt, idx) => (
                <div key={idx} className="preview-option">{String.fromCharCode(65 + idx)}. {opt}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══ Generate from OpenTDB ══ */}
      <div className="admin-panel">
        <h3 className="admin-panel-title">Generate Quiz from OpenTDB API</h3>
        <form onSubmit={handleFetchOpenTDB} className="admin-form">
          <div className="admin-field">
            <label className="admin-field-label">CATEGORY</label>
            <select className="form-input" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} disabled={isFetching}>
              <option value="">Any Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="admin-two-col">
            <div className="admin-field">
              <label className="admin-field-label">DIFFICULTY</label>
              <select className="form-input" value={selectedDifficulty} onChange={e => setSelectedDifficulty(e.target.value)} disabled={isFetching}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="admin-field">
              <label className="admin-field-label">QUESTIONS</label>
              <input type="number" min="5" max="199" className="form-input" value={amount}
                onChange={e => setAmount(parseInt(e.target.value) || 10)} disabled={isFetching} />
            </div>
          </div>
          <button type="submit" className="btn-primary glow-active" disabled={isFetching}>
            {isFetching ? 'Processing Telemetry…' : 'Fetch and Register Contest'}
          </button>
        </form>
      </div>

      {/* ══ Add Custom Question ══ */}
      <div className="admin-panel">
        <div className="admin-panel-header">
          <h3 className="admin-panel-title">Add Custom Question</h3>
          <button className="btn-secondary" onClick={() => setShowCustomForm(!showCustomForm)}>
            {showCustomForm ? '✕ Hide' : '+ Expand'}
          </button>
        </div>

        {showCustomForm && (
          <form onSubmit={handleAddCustomQuestion} className="admin-form">
            <div className="admin-field">
              <label className="admin-field-label">SELECT QUIZ *</label>
              <select className="form-input" value={selectedQuizForCustom}
                onChange={e => setSelectedQuizForCustom(e.target.value)} disabled={isAddingQuestion}>
                <option value="">-- Choose a Quiz --</option>
                {quizzesList.map(q => <option key={q.id} value={q.id}>{q.title} ({q.questionCount} questions)</option>)}
              </select>
            </div>

            <div className="admin-field">
              <label className="admin-field-label">QUESTION TEXT *</label>
              <textarea className="form-input" value={customQuestion}
                onChange={e => setCustomQuestion(e.target.value)}
                placeholder="Enter the quiz question…" disabled={isAddingQuestion}
                style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            <div className="admin-field">
              <label className="admin-field-label">ANSWER OPTIONS *</label>
              {customOptions.map((opt, idx) => (
                <div key={idx} className="option-row">
                  <input type="radio" name="correctAnswer" className="option-radio"
                    checked={correctAnswerIdx === idx} onChange={() => setCorrectAnswerIdx(idx)}
                    disabled={isAddingQuestion} title="Mark as correct answer" />
                  <input type="text" className="form-input" value={opt} placeholder={`Option ${idx + 1}`}
                    disabled={isAddingQuestion}
                    onChange={e => { const n = [...customOptions]; n[idx] = e.target.value; setCustomOptions(n); }} />
                  {customOptions.length > 2 && (
                    <button type="button" className="btn-remove-option" title="Remove option" disabled={isAddingQuestion}
                      onClick={() => { const n = customOptions.filter((_, i) => i !== idx); setCustomOptions(n); if (correctAnswerIdx >= n.length) setCorrectAnswerIdx(n.length - 1); }}>
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" className="btn-add-option"
                disabled={isAddingQuestion || customOptions.length >= 6}
                onClick={() => { if (customOptions.length < 6) setCustomOptions([...customOptions, '']); }}>
                + Add Option
              </button>
              <small className="helper-text">Select the radio button next to the correct answer (2–6 options)</small>
            </div>

            <button type="submit" className="btn-primary glow-active" disabled={isAddingQuestion}>
              {isAddingQuestion ? 'Adding Question…' : '✓ Add Question to Quiz'}
            </button>
          </form>
        )}
      </div>

      {/* ══ Bulk Import ══ */}
      <div className="admin-panel">
        <h3 className="admin-panel-title">📁 Bulk Import Questions</h3>
        <div className="admin-form">
          <div className="admin-field">
            <label className="admin-field-label">SELECT QUIZ *</label>
            <select className="form-input" value={fileQuizId}
              onChange={e => setFileQuizId(e.target.value)} disabled={isUploadingFile}>
              <option value="">-- Choose a Quiz --</option>
              {quizzesList.map(q => <option key={q.id} value={q.id}>{q.title} ({q.questionCount}/199 questions)</option>)}
            </select>
          </div>

          <div className="admin-field">
            <label className="admin-field-label">UPLOAD FILE (JSON or CSV) *</label>
            <input type="file" accept=".json,.csv" className="form-input" onChange={handleFileUpload}
              disabled={isUploadingFile || !fileQuizId}
              style={{ cursor: isUploadingFile || !fileQuizId ? 'not-allowed' : 'pointer' }} />
          </div>

          <div className="info-box">
            <strong>📋 JSON Format:</strong>
            <pre>{`[\n  {\n    "question": "Question text?",\n    "options": ["A","B","C"],\n    "correctanswer": 0\n  }\n]`}</pre>
            <strong className="info-box-csv">📊 CSV Format:</strong>
            <div className="info-box-csv">question,option1,option2,option3,correctanswer</div>
          </div>

          {isUploadingFile && <p className="uploading-text">⏳ Uploading and processing file…</p>}
        </div>
      </div>

      {/* ══ Registered Databases ══ */}
      <div className="db-section">
        <h3 className="db-section-title">Registered Databases</h3>
        <div className="db-list">
          {quizzesList.map((q, idx) => (
            <div key={q.id} style={{
              borderBottom: idx === quizzesList.length - 1 ? 'none'
                : '1px solid color-mix(in srgb, currentColor 5%, transparent)'
            }}>
              {/* Row header */}
              <div className="db-item-header" onClick={() => toggleExpand(q.id)}
                style={{ background: expandedQuizId === q.id ? 'color-mix(in srgb, currentColor 3%, transparent)' : 'transparent' }}>
                <div className="db-item-info">
                  <span className="db-item-name">{expandedQuizId === q.id ? '▼' : '▶'} {q.title}</span>
                  <span className="db-item-meta">Questions: {q.questionCount} | Attempts: {q.totalAttempts} | Avg: {q.averageScore} pts</span>
                </div>
                <div className="db-item-controls" onClick={e => e.stopPropagation()}>
                  <input type="number" min="0" className="time-input"
                    value={timeInputs[q.id] ?? q.timePerQuestion ?? 30}
                    onChange={e => setTimeInputs(p => ({ ...p, [q.id]: e.target.value }))}
                    title="Time per question (seconds)" />
                  <button className="btn-primary" onClick={() => handleUpdateTime(q.id)}
                    style={{ padding: '6px 8px', fontSize: '0.8rem' }}>Save</button>
                  <button className="btn-danger" onClick={() => handleDeleteQuiz(q.id)}>Delete Quiz</button>
                  <span className="db-difficulty-tag">{q.difficulty.toUpperCase()}</span>
                </div>
              </div>

              {/* Expanded questions */}
              {expandedQuizId === q.id && quizQuestions[q.id] && (
                <div className="db-item-body">
                  <div className="db-questions-scroll">
                    {quizQuestions[q.id].length === 0 ? (
                      <p className="auth-note">No questions in this quiz yet.</p>
                    ) : (
                      quizQuestions[q.id].map((question, qIdx) => (
                        <div key={question.id} className="db-question-row">
                          <div className="db-question-info">
                            <span className="db-question-num">Q{qIdx + 1}:</span>
                            <p className="db-question-text">{question.questionText.substring(0, 60)}…</p>
                          </div>
                          {q.questionCount >= 199 && (
                            <button className="btn-danger btn-danger--sm"
                              onClick={() => handleDeleteQuestion(q.id, question.id)}
                              title="Delete this question">Delete</button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {q.questionCount < 199 && (
                    <div className="add-more-hint">
                      ℹ️ Add {199 - q.questionCount} more questions to enable deletion
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="btn-secondary" style={{ width: '100%' }} onClick={onGoHome}>
        🏠 Return to Mission Hub
      </button>
    </div>
  );
}
