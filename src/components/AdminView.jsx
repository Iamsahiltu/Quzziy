import { useState, useEffect } from 'react';
import { addCustomQuiz, getQuizzes, addCustomQuestionToQuiz, deleteQuestionFromQuiz, getQuizQuestions, getQuizById, deleteQuiz, updateQuizTime } from '../services/db';

export default function AdminView({ onGoHome }) {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('medium');
  const [amount, setAmount] = useState(10);
  const [isFetching, setIsFetching] = useState(false);
  const [message, setMessage] = useState(null);
  const [quizzesList, setQuizzesList] = useState(() => getQuizzes());
  const [timeInputs, setTimeInputs] = useState({});
  const [randomQuizId, setRandomQuizId] = useState(() => getQuizzes()[0]?.id || '');
  const [randomQuestion, setRandomQuestion] = useState(null);
  const [randomQuestionSource, setRandomQuestionSource] = useState(null);
  const [isLoadingRandom, setIsLoadingRandom] = useState(false);

  const [showCustomQuestionForm, setShowCustomQuestionForm] = useState(false);
  const [selectedQuizForCustom, setSelectedQuizForCustom] = useState('');
  const [customQuestion, setCustomQuestion] = useState('');
  const [customOptions, setCustomOptions] = useState(['', '', '', '']);
  const [correctAnswerIdx, setCorrectAnswerIdx] = useState(0);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  
  const [expandedQuizId, setExpandedQuizId] = useState(null);
  const [quizQuestions, setQuizQuestions] = useState({});

  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [fileQuizId, setFileQuizId] = useState('');

  useEffect(() => {
    fetch('https://opentdb.com/api_category.php')
      .then(res => res.json())
      .then(data => {
        if (data && data.trivia_categories) {
          setCategories(data.trivia_categories);
        }
      })
      .catch(err => {
        console.error("Failed to fetch OpenTDB categories, using fallbacks:", err);
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

  const shuffleArray = (arr) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const handleShowRandomFromQuiz = () => {
    const quizId = randomQuizId || quizzesList[0]?.id;
    if (!quizId) {
      setMessage({ type: 'error', text: 'Please create or select a quiz first.' });
      return;
    }

    const quizQuestions = getQuizQuestions(quizId);
    if (quizQuestions.length === 0) {
      setMessage({ type: 'error', text: 'Selected quiz has no questions yet.' });
      return;
    }

    const question = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    setRandomQuestion({ ...question, source: 'quiz' });
    setRandomQuestionSource('quiz');
  };

  const handleFetchRandomApiQuestion = async () => {
    setIsLoadingRandom(true);
    setMessage(null);

    try {
      const res = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
      const data = await res.json();
      const item = data.results?.[0];

      if (!item) {
        throw new Error('No random question returned by the API.');
      }

      const correctAnswer = decodeHtml(item.correct_answer);
      const options = shuffleArray([
        correctAnswer,
        ...item.incorrect_answers.map(decodeHtml)
      ]);
      const correctIndex = options.findIndex(opt => opt === correctAnswer);

      setRandomQuestion({
        id: `api-${Date.now()}`,
        questionText: decodeHtml(item.question),
        options,
        correctIndex,
        category: item.category,
        difficulty: item.difficulty,
        source: 'api'
      });
      setRandomQuestionSource('api');
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to fetch a random API question: ${err.message}` });
    } finally {
      setIsLoadingRandom(false);
    }
  };

  const handleFetchOpenTDB = async (e) => {
    e.preventDefault();
    setIsFetching(true);
    setMessage({ type: 'info', text: 'Contacting Open Trivia Database...' });

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

        const formattedQuestions = [];
        const formattedAnswers = {};

        results.forEach((item, index) => {
          const questionId = `q-${quizId}-${index}`;
          const questionText = decodeHtml(item.question);
          const correctAns = decodeHtml(item.correct_answer);
          const incorrectAns = item.incorrect_answers.map(ans => decodeHtml(ans));

          const options = [correctAns, ...incorrectAns];
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

  const handleAddCustomQuestion = (e) => {
    e.preventDefault();
    
    if (!selectedQuizForCustom) {
      setMessage({ type: 'error', text: 'Please select a quiz to add the question to.' });
      return;
    }
    
    if (!customQuestion.trim()) {
      setMessage({ type: 'error', text: 'Please enter the question text.' });
      return;
    }
    
    if (customOptions.some(opt => !opt.trim())) {
      setMessage({ type: 'error', text: 'All options must be filled in.' });
      return;
    }

    setIsAddingQuestion(true);

    try {
      const result = addCustomQuestionToQuiz(
        selectedQuizForCustom,
        customQuestion.trim(),
        customOptions.map(opt => opt.trim()),
        correctAnswerIdx
      );

      setMessage({ 
        type: 'success', 
        text: `Question added successfully! Quiz now has ${result.quiz.questionCount} questions.` 
      });

      setCustomQuestion('');
      setCustomOptions(['', '', '', '']);
      setCorrectAnswerIdx(0);
      setShowCustomQuestionForm(false);
      
      setQuizzesList(getQuizzes());
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to add question: ${err.message}` });
    } finally {
      setIsAddingQuestion(false);
    }
  };

  const handleDeleteQuestion = (quizId, questionId) => {
    try {
      const result = deleteQuestionFromQuiz(quizId, questionId);
      setMessage({
        type: 'success',
        text: `Question deleted! Quiz now has ${result.quiz.questionCount} questions.`
      });
      
      const questions = getQuizQuestions(quizId);
      setQuizQuestions({ ...quizQuestions, [quizId]: questions });
      setQuizzesList(getQuizzes());
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const toggleQuizExpand = (quizId) => {
    if (expandedQuizId === quizId) {
      setExpandedQuizId(null);
    } else {
      setExpandedQuizId(quizId);
      const questions = getQuizQuestions(quizId);
      setQuizQuestions({ ...quizQuestions, [quizId]: questions });
    }
  };

  const handleTimeChange = (quizId, value) => {
    setTimeInputs(prev => ({ ...prev, [quizId]: value }));
  };

  const handleUpdateTime = (quizId) => {
    const val = Number(timeInputs[quizId] ?? getQuizById(quizId)?.timePerQuestion ?? 0);
    try {
      updateQuizTime(quizId, val);
      setQuizzesList(getQuizzes());
      setMessage({ type: 'success', text: `Updated time per question to ${val}s` });
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to update time: ${err.message}` });
    }
  };

  const handleDeleteQuiz = (quizId) => {
    if (!window.confirm('Delete this quiz and all its questions? This cannot be undone.')) return;
    try {
      deleteQuiz(quizId);
      setQuizzesList(getQuizzes());
      setMessage({ type: 'success', text: 'Quiz deleted successfully.' });
      if (expandedQuizId === quizId) setExpandedQuizId(null);
    } catch (err) {
      setMessage({ type: 'error', text: `Failed to delete quiz: ${err.message}` });
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!fileQuizId) {
      setMessage({ type: 'error', text: 'Please select a quiz to import questions into.' });
      return;
    }

    setIsUploadingFile(true);

    try {
      const text = await file.text();
      let questionsData = [];

      if (file.name.endsWith('.json')) {
        const json = JSON.parse(text);
        questionsData = Array.isArray(json) ? json : json.questions || [];
      } else if (file.name.endsWith('.csv')) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          const questionObj = {};
          
          headers.forEach((header, idx) => {
            if (header.startsWith('option')) {
              if (!questionObj.options) questionObj.options = [];
              questionObj.options.push(values[idx]);
            } else {
              questionObj[header] = values[idx];
            }
          });
          
          if (questionObj.question || questionObj.questiontext) {
            questionsData.push(questionObj);
          }
        }
      } else {
        throw new Error('Unsupported file format. Please use JSON or CSV.');
      }

      if (questionsData.length === 0) {
        setMessage({ type: 'error', text: 'No valid questions found in the file.' });
        return;
      }

      const currentQuiz = getQuizById(fileQuizId);
      const currentQCount = currentQuiz.questionCount || 0;
      const MAX_QUESTIONS = 199;
      const questionsToAdd = questionsData.filter(q => 
        (q.question || q.questiontext) && 
        (q.options || q.answers) && 
        (q.correctanswer !== undefined || q.correct !== undefined)
      );

      if (currentQCount >= MAX_QUESTIONS) {
        setMessage({ 
          type: 'error', 
          text: `❌ Quiz already has ${currentQCount} questions. Maximum limit is ${MAX_QUESTIONS}. Cannot add more questions.` 
        });
        setIsUploadingFile(false);
        e.target.value = '';
        return;
      }

      const availableSlots = MAX_QUESTIONS - currentQCount;
      if (questionsToAdd.length > availableSlots) {
        setMessage({ 
          type: 'error', 
          text: `⚠️ File has ${questionsToAdd.length} questions but only ${availableSlots} slots available. Max: ${MAX_QUESTIONS} per quiz.` 
        });
        setIsUploadingFile(false);
        e.target.value = '';
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const qData of questionsToAdd) {
        try {
          const questionText = qData.question || qData.questiontext || '';
          const options = qData.options || qData.answers || [];
          const correctIdx = parseInt(qData.correctanswer || qData.correct || 0);

          if (!questionText.trim() || options.length < 2) {
            failCount++;
            continue;
          }

          addCustomQuestionToQuiz(fileQuizId, questionText, options, correctIdx);
          successCount++;
        } catch (err) {
          failCount++;
          console.error('Error adding question:', err);
        }
      }

      setMessage({ 
        type: 'success', 
        text: `✓ Imported ${successCount} questions successfully!${failCount > 0 ? ` (${failCount} failed)` : ''}` 
      });

      setQuizzesList(getQuizzes());
      const updatedQuestions = getQuizQuestions(fileQuizId);
      setQuizQuestions({ ...quizQuestions, [fileQuizId]: updatedQuestions });
      setFileQuizId('');
      e.target.value = '';
    } catch (err) {
      setMessage({ type: 'error', text: `❌ Failed to parse file: ${err.message}` });
    } finally {
      setIsUploadingFile(false);
    }
  };

  return (
    <div className="max-w-[650px] mx-auto px-5 pt-10 pb-[60px]">
      <div className="text-center mb-10">
        <h1 className="text-[2.8rem] font-extrabold m-0 mb-2 gradient-text">Control Deck</h1>
        <p className="text-text-secondary text-xl m-0">Import telemetry and manage quiz files.</p>
      </div>

      {message && (
        <div className="p-4 rounded-[10px] mb-5 text-sm font-medium"
          style={{
            background: message.type === 'success' ? 'rgba(16,185,129,0.15)' : message.type === 'error' ? 'rgba(244,63,94,0.15)' : 'rgba(59,130,246,0.15)',
            color: message.type === 'success' ? '#10b981' : message.type === 'error' ? '#f43f5e' : '#3b82f6',
            border: `1px solid ${message.type === 'success' ? 'rgba(16,185,129,0.3)' : message.type === 'error' ? 'rgba(244,63,94,0.3)' : 'rgba(59,130,246,0.3)'}`
          }}>
          {message.text}
        </div>
      )}

      <div className="glass-panel p-9 mb-[30px] text-left min-h-[320px]">
        <h3 className="m-0 mb-5 text-[1.3rem]">Random Question Preview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="flex flex-col gap-2">
            <label className="text-[0.85rem] text-text-secondary">LOCAL QUIZ</label>
            <select
              className="form-input"
              value={randomQuizId}
              onChange={(e) => setRandomQuizId(e.target.value)}
            >
              <option value="">Select a quiz</option>
              {quizzesList.map(q => (
                <option key={q.id} value={q.id}>{q.title}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[0.85rem] text-text-secondary">API SOURCE</label>
            <button
              type="button"
              className="btn-secondary py-3 px-5 w-full text-[0.95rem]"
              onClick={handleFetchRandomApiQuestion}
              disabled={isLoadingRandom}
            >
              {isLoadingRandom ? 'Loading...' : 'Fetch Random API Question'}
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap mb-5">
          <button type="button" className="btn-primary glow-active" onClick={handleShowRandomFromQuiz}>
            Show Random Local Quiz Question
          </button>
          <button type="button" className="btn-secondary" onClick={() => { setRandomQuestion(null); setRandomQuestionSource(null); }}>
            Clear Preview
          </button>
        </div>

        {randomQuestion && (
          <div className="pt-5" style={{ borderTop: '1px solid color-mix(in srgb, currentColor 8%, transparent)' }}>
            <div className="flex justify-between items-center mb-4">
              <span className="text-[0.9rem] text-text-secondary">
                Source: {randomQuestionSource === 'api' ? 'OpenTDB API' : 'Local Quiz'}
              </span>
              {randomQuestion.category && (
                <span className="text-[0.9rem] text-accent-blue font-semibold">{randomQuestion.category}</span>
              )}
            </div>

            <h4 className="m-0 mb-4 text-[1.25rem] font-semibold">{randomQuestion.questionText || randomQuestion.question || randomQuestion.questiontext}</h4>

            <div className="grid gap-3">
              {(randomQuestion.options || []).map((opt, idx) => (
                <div key={idx} className="p-4 rounded-[14px] text-text-primary" style={{ background: 'color-mix(in srgb, currentColor 4%, transparent)' }}>
                  {String.fromCharCode(65 + idx)}. {opt}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel p-7 mb-[30px] text-left">
        <h3 className="m-0 mb-5 text-[1.3rem]">Generate Quiz from OpenTDB API</h3>
        
        <form onSubmit={handleFetchOpenTDB} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[0.85rem] text-text-secondary">CATEGORY</label>
            <select
              className="form-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              disabled={isFetching}
            >
              <option value="">Any Category</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[0.85rem] text-text-secondary">DIFFICULTY</label>
              <select
                className="form-input"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                disabled={isFetching}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[0.85rem] text-text-secondary">QUESTIONS</label>
              <input
                type="number"
                min="5"
                max="199"
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 10)}
                disabled={isFetching}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary glow-active mt-2" disabled={isFetching}>
            {isFetching ? 'Processing Telemetry...' : 'Fetch and Register Contest'}
          </button>
        </form>
      </div>

      <div className="glass-panel p-7 mb-[30px] text-left">
        <div className="flex justify-between items-center mb-5">
          <h3 className="m-0 text-[1.3rem]">Add Custom Question</h3>
          <button
            onClick={() => setShowCustomQuestionForm(!showCustomQuestionForm)}
            className="btn-secondary py-2 px-3 rounded-md text-[0.9rem]"
          >
            {showCustomQuestionForm ? '✕ Hide' : '+ Expand'}
          </button>
        </div>

        {showCustomQuestionForm && (
          <form onSubmit={handleAddCustomQuestion} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[0.85rem] text-text-secondary">SELECT QUIZ *</label>
              <select
                className="form-input"
                value={selectedQuizForCustom}
                onChange={(e) => setSelectedQuizForCustom(e.target.value)}
                disabled={isAddingQuestion}
              >
                <option value="">-- Choose a Quiz --</option>
                {quizzesList.map(q => (
                  <option key={q.id} value={q.id}>{q.title} ({q.questionCount} questions)</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[0.85rem] text-text-secondary">QUESTION TEXT *</label>
              <textarea
                className="form-input"
                style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Enter the quiz question..."
                disabled={isAddingQuestion}
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[0.85rem] text-text-secondary">ANSWER OPTIONS *</label>
              {customOptions.map((opt, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={correctAnswerIdx === idx}
                    onChange={() => setCorrectAnswerIdx(idx)}
                    disabled={isAddingQuestion}
                    className="cursor-pointer w-[18px] h-[18px] flex-shrink-0"
                    title="Mark as correct answer"
                  />
                  <input
                    type="text"
                    className="form-input flex-1"
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...customOptions];
                      newOpts[idx] = e.target.value;
                      setCustomOptions(newOpts);
                    }}
                    placeholder={`Option ${idx + 1}`}
                    disabled={isAddingQuestion}
                  />
                  {customOptions.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newOpts = customOptions.filter((_, i) => i !== idx);
                        setCustomOptions(newOpts);
                        if (correctAnswerIdx >= newOpts.length) {
                          setCorrectAnswerIdx(Math.max(0, newOpts.length - 1));
                        }
                      }}
                      disabled={isAddingQuestion}
                      className="py-2 px-3 rounded text-[0.85rem] flex-shrink-0"
                      style={{
                        background: 'rgba(244,63,94,0.2)',
                        border: '1px solid rgba(244,63,94,0.5)',
                        color: '#f43f5e',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        flexShrink: 0
                      }}
                      title="Delete this option"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  if (customOptions.length < 6) {
                    setCustomOptions([...customOptions, '']);
                  }
                }}
                disabled={isAddingQuestion || customOptions.length >= 6}
                className="py-2 px-3 rounded text-[0.9rem]"
                style={{
                  background: 'rgba(59,130,246,0.2)',
                  border: '1px solid rgba(59,130,246,0.5)',
                  color: '#3b82f6',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                + Add Option
              </button>
              <small className="text-text-secondary text-[0.75rem]">Select the radio button for the correct answer (2-6 options required)</small>
            </div>

            <button type="submit" className="btn-primary glow-active" disabled={isAddingQuestion}>
              {isAddingQuestion ? 'Adding Question...' : '✓ Add Question to Quiz'}
            </button>
          </form>
        )}
      </div>

      <div className="glass-panel p-7 mb-[30px] text-left">
        <div className="flex justify-between items-center mb-5">
          <h3 className="m-0 text-[1.3rem]">📁 Bulk Import Questions</h3>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-[0.85rem] text-text-secondary">SELECT QUIZ *</label>
            <select
              className="form-input"
              value={fileQuizId}
              onChange={(e) => setFileQuizId(e.target.value)}
              disabled={isUploadingFile}
            >
              <option value="">-- Choose a Quiz --</option>
              {quizzesList.map(q => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.questionCount}/199 questions)
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[0.85rem] text-text-secondary">UPLOAD FILE (JSON or CSV) *</label>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileUpload}
              disabled={isUploadingFile || !fileQuizId}
              className="form-input p-[10px] text-text-primary"
              style={{
                cursor: isUploadingFile || !fileQuizId ? 'not-allowed' : 'pointer'
              }}
            />
          </div>

          <div className="p-3 rounded-md text-sm text-accent-blue" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <strong>📋 JSON Format:</strong>
            <pre className="m-2 mt-0 text-[0.75rem] overflow-auto p-2 rounded" style={{ background: 'rgba(0,0,0,0.2)' }}>{`[
  {
    "question": "Question text?",
    "options": ["Option 1", "Option 2", "Option 3"],
    "correctanswer": 0
  }
]`}</pre>
            <strong className="mt-2 block">📊 CSV Format:</strong>
            <div className="text-[0.75rem] mt-2 font-mono">question,option1,option2,option3,correctanswer</div>
          </div>

          {isUploadingFile && (
            <div className="text-center text-text-secondary text-[0.9rem]">⏳ Uploading and processing file...</div>
          )}
        </div>
      </div>

      <div className="text-left mb-10">
        <h3 className="text-[1.25rem] mb-4">Registered Databases</h3>
        <div className="glass-panel p-0">
          {quizzesList.map((q, idx) => (
            <div key={q.id} style={{ borderBottom: idx === quizzesList.length - 1 ? 'none' : '1px solid color-mix(in srgb, currentColor 5%, transparent)' }}>
              <div
                onClick={() => toggleQuizExpand(q.id)}
                className="flex justify-between items-center p-3 cursor-pointer"
                style={{
                  background: expandedQuizId === q.id ? 'color-mix(in srgb, currentColor 3%, transparent)' : 'transparent',
                }}
              >
                <div className="flex-1">
                  <span className="font-semibold text-text-primary block mb-1">
                    {expandedQuizId === q.id ? '▼' : '▶'} {q.title}
                  </span>
                  <span className="text-[0.8rem] text-text-secondary">
                    Questions: {q.questionCount} | Attempts: {q.totalAttempts} | Avg: {q.averageScore} pts
                  </span>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <input
                    type="number"
                    min="0"
                    value={timeInputs[q.id] ?? q.timePerQuestion ?? 30}
                    onChange={(e) => handleTimeChange(q.id, e.target.value)}
                    className="w-[70px] p-1 rounded-[8px] text-text-primary bg-transparent"
                    style={{ border: '1px solid color-mix(in srgb, currentColor 12%, transparent)' }}
                    title="Time per question (seconds)"
                  />
                  <button
                    onClick={() => handleUpdateTime(q.id)}
                    className="btn-primary py-2 px-2 text-[0.8rem]"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => handleDeleteQuiz(q.id)}
                    title="Delete this quiz"
                    className="py-2 px-2 rounded-[8px] text-[0.8rem]"
                    style={{ background: 'rgba(244,63,94,0.3)', border: '1px solid rgba(244,63,94,0.5)', color: '#f43f5e', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Delete Quiz
                  </button>
                  <span className="text-[0.75rem] font-semibold py-1 px-[10px] rounded-[10px] text-text-secondary whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    {q.difficulty.toUpperCase()}
                  </span>
                </div>
              </div>

              {expandedQuizId === q.id && quizQuestions[q.id] && (
                <div className="p-3" style={{ borderTop: '1px solid color-mix(in srgb, currentColor 5%, transparent)', background: 'color-mix(in srgb, currentColor 2%, transparent)' }}>
                  <div className="max-h-[300px] overflow-y-auto mb-3">
                    {quizQuestions[q.id].length === 0 ? (
                      <p className="text-text-secondary text-[0.9rem] m-0">No questions in this quiz yet.</p>
                    ) : (
                      quizQuestions[q.id].map((question, qIdx) => (
                        <div 
                          key={question.id} 
                          className="p-2 rounded mb-2 flex justify-between items-start gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-[0.75rem] text-text-secondary">Q{qIdx + 1}:</span>
                             <p className="m-[2px_0_0_0] text-[0.85rem] text-var(--color-text-primary) break-words">{question.questionText.substring(0, 60)}...</p>
                          </div>
                          {q.questionCount >= 199 && (
                            <button
                              onClick={() => handleDeleteQuestion(q.id, question.id)}
                              title="Delete this question"
                              className="py-1 px-2 rounded text-[0.75rem] flex-shrink-0 whitespace-nowrap"
                              style={{
                                background: 'rgba(244,63,94,0.3)',
                                border: '1px solid rgba(244,63,94,0.5)',
                                color: '#f43f5e',
                                cursor: 'pointer',
                                fontSize: '0.75rem'
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  {q.questionCount < 199 && (
                    <div className="p-2 rounded text-[0.85rem] text-accent-blue" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
                      ℹ️ Add {199 - q.questionCount} more questions to enable deletion
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <button className="btn-secondary w-full" onClick={onGoHome}>
        🏠 Return to Mission Hub
      </button>
    </div>
  );
}
