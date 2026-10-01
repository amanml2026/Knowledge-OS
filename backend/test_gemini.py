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

# ── 4. Minimal API call ────────────────────────────────────
MODEL = "gemini-3.8-flash"
print(f"\n[4] Sending minimal test prompt to {MODEL}...")
try:
    response = client.models.generate_content(
        model=MODEL,
        contents="Reply with exactly three words: Gemini is working",
    )
    text = response.text.strip()
    print(f"✅  Response received: \"{text}\"")
    print(f"\n{'=' * 55}")
    print("  RESULT: Gemini connectivity SUCCEEDED ✅")
    print(f"  Model : {MODEL}")
    print(f"  Key   : loaded (YES)")
    print(f"{'=' * 55}")
    sys.exit(0)
except Exception as e:
    err = str(e)
    print(f"❌  API call failed: {err}")
    if "API_KEY_INVALID" in err or "invalid" in err.lower():
        print("\n    → The key is present but INVALID. Check it at:")
        print("      https://aistudio.google.com/app/apikey")
    elif "quota" in err.lower():
        print("\n    → Quota exceeded. Check usage at Google AI Studio.")
    elif "network" in err.lower() or "connect" in err.lower():
        print("\n    → Network error. Check your internet connection.")
    print(f"\n{'=' * 55}")
    print("  RESULT: Gemini connectivity FAILED ❌")
    print(f"{'=' * 55}")
    sys.exit(1)
