# 📖 Frontend Application — SOP (Standard Operating Procedure)

This document defines the architecture, design guidelines, and data-flow invariants for the Quiz Contest Game frontend.

## 🎯 Goal

Build a React + Vite application that serves as the player interface and admin panel for the Quiz Contest Game. The app must run completely locally using local storage if Firebase credentials are not provided, and seamlessly switch to Firebase when configured.

## 🎨 Design & Aesthetics (Premium Standard)

- **Colors**: Deep dark mode backgrounds (`#0a0f1d`), neon cyan (`#00f2fe`) and hot pink (`#4facfe`) accents, harmonious HSL tones.
- **Glassmorphism**: Cards and panels must use transparent backdrops, subtle white borders, and back-drop blurs for a high-tech sci-fi look.
- **Micro-Animations**: Hover states, smooth card sliding transitions, tick/cross splash animations, and pulse effects for active buttons.
- **Typography**: Inter or Outfit font family, proper font-scaling hierarchies.

## 🧱 Key Components

1. **`App.jsx`**: Main navigation routing (Views: `Home`, `QuizPlay`, `Result`, `Leaderboard`, `Admin`).
2. **`HomeView.jsx`**: Welcome card, stats overview, list of quizzes, name input for leaderboard.
3. **`QuizPlayView.jsx`**: Question display card, progress tracker, live countdown timer per question, answer option buttons with instant visual feedback.
4. **`ResultView.jsx`**: Displays score, accuracy percentage, time taken, and incorrect answers review.
5. **`LeaderboardView.jsx`**: High scores display from Firestore (or LocalStorage fallback).
6. **`AdminView.jsx`**: Admin controls, direct creation of custom quizzes, and integration panel to fetch new questions from OpenTDB dynamically.

## 🔄 Self-Healing Storage Gateway (`src/services/db.js`)

To ensure zero friction, we build a unified data adapter:

- **Write Operations**: Check if Firebase initialization is successful. If yes, write to Firestore (e.g. `users/{uid}`, `submissions/{id}`). If no, write to `localStorage` under keys `local_attempts`, `local_quizzes`, `local_leaderboard`.
- **Read Operations**: Check if Firebase initialization is active. If yes, fetch from Firestore. If no, load from `localStorage` populated by default with the imported OpenTDB quizzes.

## 🚦 Security & Grading Invariant

- **Rule**: Correct answers should not be stored in the quiz card loaded by the standard player.
- **Mitigation for local mode**: Correct answers are stored in a separate, encrypted/hidden array inside the DB module or validated via local API.
- **Mitigation for Firebase mode**: Gradings are verified in Cloud Functions using the `answers` collection, returning only the score to the client.
- **Implementation**: The app loads two JSON lists locally: `quizzes_public` (without correct answers) and `quizzes_keys` (used only for local grading).

## ⚠️ Edge Cases

- **Timer Expired**: If the timer hits zero, the question is marked incorrect, and the app auto-slides to the next question.
- **No Internet**: Public API fetches in the Admin panel should catch exceptions and show a offline toast, allowing play of pre-loaded local quizzes.
- **Display name missing**: Prompt user to input their name before joining the quiz.
