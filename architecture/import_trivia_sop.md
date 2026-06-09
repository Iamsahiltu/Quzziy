# 📖 import_trivia.py — SOP (Standard Operating Procedure)

This document defines the deterministic logic for importing and formatting trivia questions from the Open Trivia DB API.

## 🎯 Goal
Fetch a set of multiple-choice questions from the Open Trivia DB API, parse and decode them, shuffle options, structure them according to our database schemas, and output them to a local JSON payload. Optionally upload directly to Firestore if credentials are provided.

## 📥 Inputs
- **API URL**: `https://opentdb.com/api.php`
- **Parameters**:
  - `amount`: Number of questions (default: 10, max 50)
  - `category`: Category ID (optional, 9-32)
  - `difficulty`: `easy`, `medium`, `hard` (required)
  - `type`: `multiple` (only multiple choice supported)
- **Local Settings / Env**:
  - `.env` variables (optional Firebase Admin credentials)

## ⚙️ Tool Logic Flow

1. **Parameter Validation**:
   - Ensure difficulty is one of: `easy`, `medium`, `hard`.
   - Ensure amount is between 1 and 50.
   - Enforce rate limit (must space requests to OpenTDB by >= 5 seconds).

2. **API Fetching**:
   - Call OpenTDB Questions endpoint.
   - Parse response. Handle response codes:
     - `0`: Success.
     - `5`: Rate limit exceeded (wait and retry).
     - Others: Terminate with appropriate error.

3. **Data Normalization & Formatting (Rule-Conforming)**:
   - For each question:
     - **HTML Decoding**: Convert HTML entities (e.g. `&quot;`, `&#039;`) to standard UTF-8 text for both question text and options.
     - **Option Shuffling**: Combine `correct_answer` with `incorrect_answers` list. Shuffle the combined list randomly.
     - **Schema Conformity**:
       - Create quiz question object:
         ```json
         {
           "id": "generated_uuid",
           "questionText": "decoded question text",
           "options": ["shuffled option 1", "shuffled option 2", "shuffled option 3", "shuffled option 4"],
           "points": 1,
           "order": index
         }
         ```
       - Create server-only answer object:
         ```json
         {
           "questionId": "generated_uuid",
           "correctAnswerIndex": index_of_correct_answer_in_shuffled_options,
           "explanation": ""
         }
         ```

4. **Output Operations**:
   - Write structured quiz data and server-only answers to `.tmp/quizzes_import.json`.
   - Format:
     ```json
     {
       "quiz": {
         "title": "Category Name - Difficulty Quiz",
         "description": "Generated via Open Trivia DB",
         "category": "Category Name",
         "difficulty": "difficulty",
         "timePerQuestion": 30,
         "questionCount": N
       },
       "questions": [...],
       "answers": [...]
     }
     ```

5. **Optional Firestore Upload**:
   - If `FIREBASE_SERVICE_ACCOUNT_JSON` is found in `.env`:
     - Initialize `firebase-admin`.
     - Write quiz document to `/quizzes/{quizId}`.
     - Write question documents to `/quizzes/{quizId}/questions/{questionId}`.
     - Write answer documents to `/answers/{questionId}` (server-only secure collection).

## ⚠️ Edge Cases & Mitigations
- **OpenTDB Rate Limits**: Script must catch code `5` and wait 5 seconds before retrying, or exit gracefully warning the user.
- **Empty Categories**: If category has fewer questions than requested, fallback to a general category or exit gracefully.
- **Unicode console prints**: Always catch console print errors and omit emojis or special characters if encoding fails.
