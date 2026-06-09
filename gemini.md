# 🧬 gemini.md — Project Constitution

> **This file is LAW.** All tools, scripts, and architecture SOPs must conform to the schemas and rules defined here.
> **Last Updated**: 2026-06-09
> **Project Status**: 🟢 COMPLETE — LOCAL PRODUCTION READY

---

## 📌 Project Identity

| Field | Value |
|-------|-------|
| **Project Name** | Quiz Contest Game |
| **North Star** | A quiz contest platform where an admin creates quizzes and users compete asynchronously (take quizzes at their own pace) |
| **Integrations** | Firebase (Auth, Firestore, Hosting) + Open Trivia DB API (auto-generate questions) |
| **Source of Truth** | Admin panel UI for creating/editing/deleting questions; Firestore as persistent storage |
| **Delivery Payload** | Web app built with Vite + React |
| **Behavioral Rules** | Multiple difficulty levels (Easy / Medium / Hard) |

---

## 📐 Data Schema

> **Data-First Rule**: No code is written until the input/output payload shapes are confirmed here.
> ### Schema Status: ✅ CONFIRMED

### Firestore Collections

#### `users/{uid}`
```json
{
  "displayName": "string",
  "email": "string",
  "photoURL": "string",
  "role": "string (user | admin)",
  "totalScore": "number (denormalized)",
  "quizzesCompleted": "number",
  "createdAt": "timestamp",
  "lastLoginAt": "timestamp"
}
```

#### `users/{uid}/attempts/{attemptId}` (subcollection)
```json
{
  "quizId": "string",
  "quizTitle": "string (denormalized)",
  "score": "number",
  "totalQuestions": "number",
  "correctAnswers": "number",
  "percentage": "number",
  "timeTaken": "number (seconds)",
  "difficulty": "string (easy | medium | hard)",
  "submittedAt": "timestamp",
  "answers": "map { questionId: selectedOptionIndex }"
}
```

#### `quizzes/{quizId}`
```json
{
  "title": "string",
  "description": "string",
  "category": "string",
  "difficulty": "string (easy | medium | hard)",
  "timePerQuestion": "number (seconds, 0 = unlimited)",
  "questionCount": "number",
  "isPublished": "boolean",
  "createdBy": "string (admin uid)",
  "createdAt": "timestamp",
  "updatedAt": "timestamp",
  "totalAttempts": "number (denormalized)",
  "averageScore": "number (denormalized)"
}
```

#### `quizzes/{quizId}/questions/{questionId}` (subcollection)
```json
{
  "questionText": "string",
  "options": ["string", "string", "string", "string"],
  "imageURL": "string (optional)",
  "order": "number",
  "points": "number (default 1)"
}
```
> ⚠️ **NO `correctAnswerIndex` here** — stored in server-only `answers` collection

#### `answers/{questionId}` 🔒 SERVER-ONLY
```json
{
  "quizId": "string",
  "correctAnswerIndex": "number",
  "explanation": "string (optional)"
}
```
> 🔒 `allow read: if false; allow write: if false;` — Admin SDK only

#### `submissions/{submissionId}`
```json
{
  "userId": "string",
  "quizId": "string",
  "answers": "map { questionId: selectedOptionIndex }",
  "submittedAt": "timestamp",
  "status": "string (pending | graded)",
  "score": "number (written by Cloud Function)"
}
```

#### `leaderboard/{entryId}`
```json
{
  "userId": "string",
  "displayName": "string (denormalized)",
  "photoURL": "string (denormalized)",
  "totalScore": "number",
  "quizzesCompleted": "number",
  "averagePercentage": "number",
  "lastUpdated": "timestamp"
}
```

### Open Trivia DB API — Input/Output

#### Request (Input)
```
GET https://opentdb.com/api.php?amount=10&category=18&difficulty=medium&type=multiple&token=TOKEN
```

#### Response (Output)
```json
{
  "response_code": 0,
  "results": [{
    "type": "multiple",
    "difficulty": "medium",
    "category": "Science: Computers",
    "question": "HTML-encoded question text",
    "correct_answer": "Correct answer string",
    "incorrect_answers": ["Wrong 1", "Wrong 2", "Wrong 3"]
  }]
}
```

---

## 🚦 Behavioral Rules

> How the system must "act" — tone, constraints, and "Do Not" rules.

1. **Difficulty Levels**: All quizzes have exactly one of: `easy`, `medium`, `hard`
2. **Anti-Cheat**: Correct answers NEVER reach the client. Grading is server-side only.
3. **Progressive Auth**: Anonymous users can play → prompted to link Google account to save progress.
4. **Admin Gating**: Only users with `role: "admin"` (Custom Claims `admin: true`) can access `/admin` routes.
5. **Data Integrity**: Scores, leaderboard, and attempt records are ONLY written by Cloud Functions.
6. **HTML Decoding**: All OpenTDB strings must be HTML-decoded before storage or display.
7. **Answer Shuffling**: When importing from OpenTDB, correct + incorrect answers must be shuffled randomly.
8. **Rate Limiting**: OpenTDB calls must be spaced ≥5 seconds apart.

---

## 🏛️ Architectural Invariants

> Structural guarantees that must never be violated.

1. **Separation of Concerns**: Business logic lives in `tools/` as deterministic Python/JS execution scripts. LLM reasoning stays in the Navigation layer.
2. **SOP-First**: No tool code is updated without first updating its corresponding SOP in `architecture/`.
3. **Data-First**: No tool code is written until Input/Output schemas are confirmed in this file.
4. **Ephemeral vs. Persistent**: `.tmp/` files are disposable. Only confirmed Payloads reach their cloud/final destination.
5. **Self-Annealing**: Every error triggers Analyze → Patch → Test → Update SOP. Errors are never silently ignored.
6. **Env Isolation**: All secrets live in `.env`. Never hardcode credentials.

---

## 🔧 Environment Variables

> Populated during Phase 2 — Link

| Variable | Service | Status |
|----------|---------|--------|
| _TBD_ | — | ⏳ |

---

## 📝 Maintenance Log

> Finalized during Phase 5 — Trigger

| Date | Change | Author | Reason |
|------|--------|--------|--------|
| 2026-06-09 | Project initialized in D:\app | System Pilot | Protocol 0 |

---

## 🔒 Schema Change Protocol

> Changing this file is a controlled operation.

1. Propose the schema change in `progress.md`
2. Get user confirmation
3. Update `gemini.md`
4. Update all affected SOPs in `architecture/`
5. Update all affected tools in `tools/`
6. Re-test the full pipeline
