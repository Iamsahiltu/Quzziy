import urllib.request
import json
import time

def verify_opentdb():
    print("Testing Open Trivia DB API...")
    url = "https://opentdb.com/api.php?amount=1&type=multiple"
    
    try:
        req = urllib.request.Request(
            url, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            body = response.read().decode('utf-8')
            
            if status == 200:
                data = json.loads(body)
                if data.get('response_code') == 0:
                    print("[OK] Open Trivia DB API Connection: SUCCESS")
                    # Safely handle potential Unicode characters in the question text
                    try:
                        print(f"Sample Question: {data['results'][0]['question']}")
                    except Exception:
                        print("Sample Question: (Unicode characters omitted for console compatibility)")
                    return True
                else:
                    print(f"[ERROR] Open Trivia DB API responded with code: {data.get('response_code')}")
                    return False
            else:
                print(f"[ERROR] Open Trivia DB API HTTP Error: {status}")
                return False
    except Exception as e:
        print(f"[ERROR] Open Trivia DB API Connection Failed: {e}")
        return False

if __name__ == "__main__":
    verify_opentdb()
