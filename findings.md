# 🔬 Findings Log

> **Purpose**: Captures all research, discoveries, API quirks, constraints, and external resources found during the project.
> **Last Updated**: 2026-06-09

---

## 📌 Status
✅ Phase 1 Discovery Research Complete

---

## 🌐 External Resources & Research

| Resource | URL | Relevance |
|----------|-----|-----------|
| Open Trivia DB API | https://opentdb.com/api.php | Auto-generate quiz questions |
| Open Trivia Categories | https://opentdb.com/api_category.php | Dynamic category list (24 categories, IDs 9-32) |
| Fireship Quiz App (Flutter) | https://github.com/fireship-io/flutter-firebase-quizapp-course | Architecture reference |
| React + Firebase Quiz | https://github.com/jamesqquick/Build-a-Quiz-App-with-React-and-Firebase | React patterns reference |
| Quiz App w/ Admin Panel | https://github.com/yasinpalash/Quiz-Application-with-Firebase | Admin panel reference |

---

## 🔑 API / Integration Notes

### Open Trivia DB API

| Property | Detail |
|----------|--------|
| Base URL | `https://opentdb.com/api.php` |
| Auth | None required (free & open) |
| Rate Limit | **1 request per 5 seconds** per IP (response_code: 5 if exceeded) |
| Max per request | 50 questions |
| Session Token | Prevents duplicate questions; expires after 6hrs inactivity |
| Encoding | Default: HTML entities — **MUST decode** (`&#039;` → `'`) |

**Response Codes**: 0=Success, 1=No Results, 2=Invalid Param, 3=Token Not Found, 4=Token Empty, 5=Rate Limit

**Key Endpoints**:
- Questions: `GET /api.php?amount=N&category=ID&difficulty=LEVEL&type=multiple`
- Token Request: `GET /api_token.php?command=request`
- Token Reset: `GET /api_token.php?command=reset&token=TOKEN`
- Categories: `GET /api_category.php`

### Firebase Services Needed

| Service | Role | Priority |
|---------|------|----------|
| Firebase Auth | User identity (Anonymous → Google progressive) | Essential |
| Cloud Firestore | Primary database | Essential |
| Cloud Functions | Server-side grading, anti-cheat | Essential |
| Firebase Hosting | Deploy web app | Essential |

---

## ⚠️ Constraints & Gotchas

1. **HTML Entity Encoding** — OpenTDB returns HTML-encoded strings by default. Must decode before display.
2. **Answer Shuffling Required** — `correct_answer` and `incorrect_answers` are separate; must combine and shuffle.
3. **Category IDs start at 9** — No categories with IDs 0-8.
4. **Limited questions per category/difficulty** — Check availability before requesting.
5. **Answers MUST be server-only** — Never store correct answers in client-readable Firestore documents.
6. **Cloud Functions required for grading** — Client submits answers → Cloud Function grades → writes score.
7. **Anonymous accounts are device-bound** — Uninstall = data loss if not linked to permanent auth.

---

## 💡 Architecture Decisions

1. **Separate `answers` collection (server-only)** — Most critical security decision. Clients never see correct answers.
2. **Progressive Auth** — Anonymous → Google Sign-In → preserves data via `linkWithCredential()`.
3. **Admin Panel as same app (/admin route)** — Single codebase, code-split for bundle efficiency.
4. **Questions as subcollection of quizzes** — Keeps `quizzes` collection lean.
5. **Leaderboard as separate collection** — Pre-computed by Cloud Functions for fast reads.
6. **Denormalization** — Copy `displayName`/`photoURL` into leaderboard entries to avoid extra reads.

---

## 🐛 Errors Encountered & Resolutions

| Date | Tool | Error | Root Cause | Fix Applied | SOP Updated? |
|------|------|-------|------------|-------------|--------------|
| — | — | — | — | — | — |
