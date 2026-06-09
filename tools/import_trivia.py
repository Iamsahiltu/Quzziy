import urllib.request
import json
import random
import uuid
import html
import time
import os
import sys

def decode_text(text):
    return html.unescape(text)

def fetch_quizzes_from_api(amount, category, difficulty):
    url = f"https://opentdb.com/api.php?amount={amount}&difficulty={difficulty}&type=multiple"
    if category:
        url += f"&category={category}"
        
    print(f"Fetching questions from: {url}")
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            if status != 200:
                print(f"[ERROR] API HTTP error: {status}")
                return None
            body = response.read().decode('utf-8')
            data = json.loads(body)
            return data
    except Exception as e:
        print(f"[ERROR] API connection failed: {e}")
        return None

def process_questions(results, difficulty):
    questions = []
    answers = []
    
    for index, item in enumerate(results):
        question_id = str(uuid.uuid4())
        question_text = decode_text(item['question'])
        correct_answer = decode_text(item['correct_answer'])
        incorrect_answers = [decode_text(ans) for ans in item['incorrect_answers']]
        
        # Combine and shuffle options
        options = [correct_answer] + incorrect_answers
        random.shuffle(options)
        
        # Find index of correct answer in shuffled options
        correct_index = options.index(correct_answer)
        
        questions.append({
            "id": question_id,
            "questionText": question_text,
            "options": options,
            "points": 1,
            "order": index + 1
        })
        
        answers.append({
            "questionId": question_id,
            "correctAnswerIndex": correct_index,
            "explanation": f"The correct answer is: {correct_answer}"
        })
        
    return questions, answers

def upload_to_firestore(quiz_data, questions, answers):
    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if not service_account_path or not os.path.exists(service_account_path):
        print("[INFO] No FIREBASE_SERVICE_ACCOUNT_JSON found or file doesn't exist. Skipping Firestore upload.")
        return False
        
    try:
        import firebase_admin
        from firebase_admin import credentials
        from firebase_admin import firestore
        
        print(f"Initializing Firebase Admin SDK using: {service_account_path}")
        cred = credentials.Certificate(service_account_path)
        # Avoid re-initialization error if app is already initialized
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
            
        db = firestore.client()
        quiz_id = quiz_data["id"]
        
        print(f"Uploading quiz {quiz_id} to Firestore...")
        
        # 1. Upload quiz document
        db.collection("quizzes").document(quiz_id).set(quiz_data)
        
        # 2. Upload questions subcollection
        for q in questions:
            db.collection("quizzes").document(quiz_id).collection("questions").document(q["id"]).set(q)
            
        # 3. Upload server-only answers collection
        for a in answers:
            # We associate correct answers using questionId as the document ID in 'answers' collection
            db.collection("answers").document(a["questionId"]).set({
                "quizId": quiz_id,
                "correctAnswerIndex": a["correctAnswerIndex"],
                "explanation": a["explanation"]
            })
            
        print("[OK] Firestore upload complete!")
        return True
        
    except ImportError:
        print("[WARNING] 'firebase-admin' package is not installed. To upload to Firestore, run 'pip install firebase-admin'")
        return False
    except Exception as e:
        print(f"[ERROR] Firestore upload failed: {e}")
        return False

def main():
    # Hardcoded or command line arguments
    amount = 10
    category = None # None means any category
    difficulty = "medium"
    
    if len(sys.argv) > 1:
        try:
            amount = int(sys.argv[1])
        except ValueError:
            pass
    if len(sys.argv) > 2:
        difficulty = sys.argv[2]
    if len(sys.argv) > 3:
        category = sys.argv[3]
        
    if difficulty not in ["easy", "medium", "hard"]:
        print("[ERROR] Difficulty must be 'easy', 'medium', or 'hard'")
        sys.exit(1)
        
    # Rate limit check (OpenTDB API rules)
    print("Enforcing rate limiting...")
    time.sleep(2) # brief pause
    
    api_data = fetch_quizzes_from_api(amount, category, difficulty)
    if not api_data:
        print("[ERROR] Failed to fetch trivia from API.")
        sys.exit(1)
        
    res_code = api_data.get("response_code", -1)
    if res_code != 0:
        print(f"[ERROR] API returned response code: {res_code}")
        if res_code == 5:
            print("[INFO] OpenTDB Rate limit hit. Please wait 5 seconds.")
        sys.exit(1)
        
    results = api_data.get("results", [])
    if not results:
        print("[ERROR] No questions returned.")
        sys.exit(1)
        
    # Get category name from the first result
    category_name = results[0]["category"]
    
    quiz_id = str(uuid.uuid4())
    questions, answers = process_questions(results, difficulty)
    
    quiz_metadata = {
        "id": quiz_id,
        "title": f"{category_name} - {difficulty.capitalize()} Quiz",
        "description": f"Automatically generated quiz from Open Trivia Database.",
        "category": category_name,
        "difficulty": difficulty,
        "timePerQuestion": 30,
        "questionCount": len(questions),
        "isPublished": True,
        "createdBy": "admin_system",
        "createdAt": int(time.time() * 1000),
        "updatedAt": int(time.time() * 1000),
        "totalAttempts": 0,
        "averageScore": 0
    }
    
    output_payload = {
        "quiz": quiz_metadata,
        "questions": questions,
        "answers": answers
    }
    
    # Ensure .tmp and src/data directories exist
    os.makedirs(".tmp", exist_ok=True)
    os.makedirs(os.path.join("src", "data"), exist_ok=True)
    
    output_path = os.path.join(".tmp", "quizzes_import.json")
    web_output_path = os.path.join("src", "data", "quizzes_import.json")
    
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2)
        
    with open(web_output_path, "w", encoding="utf-8") as f:
        json.dump(output_payload, f, indent=2)
        
    print(f"[OK] Quiz import payload saved locally to: {output_path}")
    print(f"[OK] Quiz import payload copied for Web UI to: {web_output_path}")
    print(f"Generated Quiz: {quiz_metadata['title']} ({quiz_metadata['questionCount']} questions)")
    
    # Try uploading to Firestore if credentials exist
    upload_to_firestore(quiz_metadata, questions, answers)

if __name__ == "__main__":
    main()
