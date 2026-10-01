"""
Gemini connectivity test — run from backend/ with:
    .\\venv\\Scripts\\python.exe test_gemini.py

NEVER prints or logs the API key itself.
Exit codes: 0 = success, 1 = failure.
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv(override=True)

key = os.environ.get("GEMINI_API_KEY", "").strip()

print("=" * 55)
print("  Knowledge OS — Gemini Connectivity Test")
print("=" * 55)

# ── 1. Key presence check ──────────────────────────────────
if not key:
    print("\n❌  GEMINI_API_KEY is not set or is empty in backend/.env")
    print("    Open backend/.env and add your key:")
    print('    GEMINI_API_KEY="AIza..."')
    print("\n    Get a free key at: https://aistudio.google.com/app/apikey")
    sys.exit(1)

print(f"\n✅  Key loaded: YES")
print(f"    Key length : {len(key)} characters")
print(f"    Key prefix : {key[:6]}...")

# ── 2. SDK import check ────────────────────────────────────
print("\n[2] Checking google-genai SDK...")
try:
    from google import genai
    from google.genai import types
    print("✅  google.genai SDK imported OK")
except ImportError as e:
    print(f"❌  SDK import failed: {e}")
    print("    Run: pip install google-genai")
    sys.exit(1)

# ── 3. Client instantiation ────────────────────────────────
print("\n[3] Instantiating Gemini client...")
try:
    client = genai.Client(api_key=key)
    print("✅  Client created OK")
except Exception as e:
    print(f"❌  Client creation failed: {e}")
    sys.exit(1)

import time
import random
import re

MODEL = "gemini-3.8-flash"
print(f"\n[4] Sending 3 minimal test prompts to {MODEL} with retries...")

success_count = 0
for i in range(3):
    max_retries = 3
    base_delay = 2.0
    print(f"\n  -- Request {i+1}/3 --")
    
    for attempt in range(max_retries + 1):
        try:
            response = client.models.generate_content(
                model=MODEL,
                contents=f"Reply with exactly three words: Request {i+1} working",
            )
            text = response.text.strip()
            print(f"  ✅  Response received: \"{text}\"")
            success_count += 1
            break
        except Exception as e:
            err = str(e)
            is_transient = ("503" in err and "UNAVAILABLE" in err) or ("429" in err)
            
            if attempt < max_retries and is_transient:
                delay = (base_delay ** attempt) + random.uniform(0, 1)
                retry_match = re.search(r"'retryDelay':\s*'(\d+(\.\d+)?)s'", err)
                if retry_match:
                    delay = max(delay, float(retry_match.group(1)))
                print(f"  ⏳  Attempt {attempt+1} failed ({'503 UNAVAILABLE' if '503' in err else '429 EXHAUSTED'}). Retrying in {delay:.1f}s...")
                time.sleep(delay)
                continue
                
            print(f"  ❌  API call failed on attempt {attempt+1}: {err}")
            if "API_KEY_INVALID" in err or "invalid" in err.lower():
                print("      → The key is present but INVALID.")
            break

print(f"\n{'=' * 55}")
if success_count == 3:
    print(f"  RESULT: Gemini connectivity SUCCEEDED ✅ ({success_count}/3)")
else:
    print(f"  RESULT: Gemini connectivity FAILED ❌ ({success_count}/3 succeeded)")
print(f"  Model : {MODEL}")
print(f"  Key   : loaded (YES)")
print(f"{'=' * 55}")
if success_count < 3:
    sys.exit(1)
sys.exit(0)
