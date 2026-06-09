import defaultImportedQuiz from '../data/quizzes_import.json';

// Local storage keys
const QUIZZES_KEY = 'quiz_contest_quizzes';
const QUESTIONS_KEY = 'quiz_contest_questions';
const ANSWERS_KEY = 'quiz_contest_answers';
const LEADERBOARD_KEY = 'quiz_contest_leaderboard';
const ATTEMPTS_KEY = 'quiz_contest_attempts';

// Initialize default data if local storage is empty
export function initializeLocalDB() {
  if (!localStorage.getItem(QUIZZES_KEY)) {
    const quizzes = {};
    const questions = {};
    const answers = {};

    // Load default imported quiz from OpenTDB
    if (defaultImportedQuiz && defaultImportedQuiz.quiz) {
      const qMeta = defaultImportedQuiz.quiz;
      const qList = defaultImportedQuiz.questions;
      const aList = defaultImportedQuiz.answers;

      quizzes[qMeta.id] = qMeta;
      questions[qMeta.id] = qList;
      
      answers[qMeta.id] = {};
      aList.forEach(ans => {
        answers[qMeta.id][ans.questionId] = ans.correctAnswerIndex;
      });
    }

    // Load a fallback secondary quiz just in case
    const fallbackQuizId = "fallback-general-knowledge";
    quizzes[fallbackQuizId] = {
      id: fallbackQuizId,
      title: "General Knowledge - Easy Quiz",
      description: "A fun and simple general knowledge quiz to test your basics.",
      category: "General Knowledge",
      difficulty: "easy",
      timePerQuestion: 20,
      questionCount: 3,
      isPublished: true,
      createdBy: "admin_fallback",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalAttempts: 0,
      averageScore: 0
    };

    questions[fallbackQuizId] = [
      {
        id: "fk-q1",
        questionText: "What is the capital of France?",
        options: ["London", "Berlin", "Paris", "Rome"],
        points: 1,
        order: 1
      },
      {
        id: "fk-q2",
        questionText: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Saturn"],
        points: 1,
        order: 2
      },
      {
        id: "fk-q3",
        questionText: "What is the largest ocean on Earth?",
        options: ["Atlantic Ocean", "Indian Ocean", "Southern Ocean", "Pacific Ocean"],
        points: 1,
        order: 3
      }
    ];

    answers[fallbackQuizId] = {
      "fk-q1": 2, // Paris
      "fk-q2": 1, // Mars
      "fk-q3": 3  // Pacific Ocean
    };

    localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
    localStorage.setItem(ANSWERS_KEY, JSON.stringify(answers));
  }

  if (!localStorage.getItem(LEADERBOARD_KEY)) {
    const defaultLeaderboard = [
      { userId: "mock-1", displayName: "TriviaKing", totalScore: 8, quizzesCompleted: 1, averagePercentage: 80, lastUpdated: Date.now() },
      { userId: "mock-2", displayName: "EinsteinJr", totalScore: 10, quizzesCompleted: 1, averagePercentage: 100, lastUpdated: Date.now() },
      { userId: "mock-3", displayName: "BrainyM", totalScore: 6, quizzesCompleted: 1, averagePercentage: 60, lastUpdated: Date.now() }
    ];
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(defaultLeaderboard));
  }

  if (!localStorage.getItem(ATTEMPTS_KEY)) {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify([]));
  }
}

// Get all quizzes
export function getQuizzes() {
  initializeLocalDB();
  const quizzes = JSON.parse(localStorage.getItem(QUIZZES_KEY) || '{}');
  return Object.values(quizzes).filter(q => q.isPublished);
}

// Get quiz by id (public details only)
export function getQuizById(id) {
  initializeLocalDB();
  const quizzes = JSON.parse(localStorage.getItem(QUIZZES_KEY) || '{}');
  return quizzes[id] || null;
}

// Get questions for a quiz (without answers)
export function getQuizQuestions(quizId) {
  initializeLocalDB();
  const questionsMap = JSON.parse(localStorage.getItem(QUESTIONS_KEY) || '{}');
  return questionsMap[quizId] || [];
}

// Grade submissions and calculate score locally (secure emulation)
export function gradeQuizSubmission(quizId, userAnswers, timeTaken) {
  initializeLocalDB();
  const answersMap = JSON.parse(localStorage.getItem(ANSWERS_KEY) || '{}');
  const questionsMap = JSON.parse(localStorage.getItem(QUESTIONS_KEY) || '{}');
  
  const quizAnswers = answersMap[quizId] || {};
  const questions = questionsMap[quizId] || [];
  
  let correctCount = 0;
  const totalQuestions = questions.length;
  
  questions.forEach(q => {
    const selectedIndex = userAnswers[q.id];
    const correctIndex = quizAnswers[q.id];
    if (selectedIndex !== undefined && selectedIndex === correctIndex) {
      correctCount++;
    }
  });

  const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const score = correctCount; // 1 point per correct answer

  return {
    score,
    correctAnswers: correctCount,
    totalQuestions,
    percentage,
    timeTaken
  };
}

// Save quiz attempt and update leaderboard
export function saveAttempt(displayName, quizId, scoreDetails) {
  initializeLocalDB();
  
  // 1. Save individual attempt
  const attempts = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '[]');
  const newAttempt = {
    attemptId: `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    quizId,
    quizTitle: getQuizById(quizId)?.title || "Unknown Quiz",
    displayName,
    submittedAt: Date.now(),
    ...scoreDetails
  };
  attempts.push(newAttempt);
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));

  // 2. Update Quiz statistics
  const quizzes = JSON.parse(localStorage.getItem(QUIZZES_KEY) || '{}');
  if (quizzes[quizId]) {
    const q = quizzes[quizId];
    const currentAttempts = q.totalAttempts || 0;
    const currentAvg = q.averageScore || 0;
    
    q.totalAttempts = currentAttempts + 1;
    q.averageScore = parseFloat(((currentAvg * currentAttempts + scoreDetails.score) / q.totalAttempts).toFixed(1));
    quizzes[quizId] = q;
    localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
  }

  // 3. Update Leaderboard
  const leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
  let userEntry = leaderboard.find(u => u.displayName.toLowerCase() === displayName.toLowerCase());

  if (userEntry) {
    userEntry.totalScore += scoreDetails.score;
    userEntry.quizzesCompleted += 1;
    userEntry.averagePercentage = Math.round(
      (userEntry.averagePercentage * (userEntry.quizzesCompleted - 1) + scoreDetails.percentage) / userEntry.quizzesCompleted
    );
    userEntry.lastUpdated = Date.now();
  } else {
    userEntry = {
      userId: `user-${Date.now()}`,
      displayName,
      totalScore: scoreDetails.score,
      quizzesCompleted: 1,
      averagePercentage: scoreDetails.percentage,
      lastUpdated: Date.now()
    };
    leaderboard.push(userEntry);
  }

  // Sort by total score descending, then average percentage descending
  leaderboard.sort((a, b) => b.totalScore - a.totalScore || b.averagePercentage - a.averagePercentage);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));

  return newAttempt;
}

// Get leaderboard
export function getLeaderboard() {
  initializeLocalDB();
  return JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
}

// Get user attempts
export function getUserAttempts(displayName) {
  initializeLocalDB();
  const attempts = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || '[]');
  return attempts.filter(a => a.displayName.toLowerCase() === displayName.toLowerCase());
}

// Add a custom quiz (from Admin Panel)
export function addCustomQuiz(quiz, questions, answers) {
  initializeLocalDB();
  
  const quizzes = JSON.parse(localStorage.getItem(QUIZZES_KEY) || '{}');
  const questionsMap = JSON.parse(localStorage.getItem(QUESTIONS_KEY) || '{}');
  const answersMap = JSON.parse(localStorage.getItem(ANSWERS_KEY) || '{}');

  quizzes[quiz.id] = quiz;
  questionsMap[quiz.id] = questions;
  answersMap[quiz.id] = answers;

  localStorage.setItem(QUIZZES_KEY, JSON.stringify(quizzes));
  localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questionsMap));
  localStorage.setItem(ANSWERS_KEY, JSON.stringify(answersMap));

  return quiz;
}
