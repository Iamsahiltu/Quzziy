import subprocess
import sys

def verify_firebase_toolchain():
    print("Testing Firebase toolchain availability...")
    try:
        # Run npx firebase-tools --version to verify the CLI is installed and accessible
        result = subprocess.run(
            ["npx", "firebase-tools", "--version"],
            capture_output=True,
            text=True,
            shell=True
        )
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"[OK] Firebase CLI toolchain is available (Version: {version})")
            return True
        else:
            print(f"[ERROR] Firebase CLI toolchain returned error code: {result.returncode}")
            print(f"Details: {result.stderr}")
            return False
    except Exception as e:
        print(f"[ERROR] Failed to execute firebase CLI check: {e}")
        return False

if __name__ == "__main__":
    verify_firebase_toolchain()
