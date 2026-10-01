"""
AI service module — provider abstraction for Knowledge OS.

Supports:
  - GeminiProvider: real Gemini API via google.genai (current SDK)
  - MockProvider:   safe fallback when GEMINI_API_KEY is not set

Never import this module at the top level of main.py; use get_ai_provider()
as a FastAPI dependency or call it at request time so it reads the env var
fresh each call.
"""
import os
import json
from dotenv import load_dotenv

# Load .env if present; override=True ensures a fresh read on every (re)start
load_dotenv(override=True)


# ─────────────────────── Base abstraction ──────────────────────────────────

class AIProvider:
    def chat(self, prompt: str, system_instruction: str = "", response_schema: dict = None) -> str:
        raise NotImplementedError


# ─────────────────────── Mock (no key configured) ──────────────────────────

class MockProvider(AIProvider):
    def chat(self, prompt: str, system_instruction: str = "", response_schema: dict = None) -> str:
        msg = (
            "⚙️ Gemini API key is not configured. "
            "Please set GEMINI_API_KEY in backend/.env to enable real AI responses."
        )
        if response_schema:
            return json.dumps({"error": msg, "response": msg})
        return msg


# ─────────────────────── Gemini (google.genai SDK) ─────────────────────────

class GeminiProvider(AIProvider):
    MODEL = "gemini-3.8-flash"

    def __init__(self, api_key: str):
        from google import genai as _genai
        from google.genai import types as _types
        self._client = _genai.Client(api_key=api_key)
        self._types = _types

    def chat(self, prompt: str, system_instruction: str = "", response_schema: dict = None) -> str:
        import time
        import random
        import re
        from fastapi import HTTPException

        config_kwargs = {}
        if system_instruction:
            config_kwargs["system_instruction"] = system_instruction
        if response_schema:
            config_kwargs["response_mime_type"] = "application/json"
            prompt = (
                prompt
                + f"\n\nRespond strictly as valid JSON matching this schema:\n"
                + json.dumps(response_schema, indent=2)
            )

        generate_config = self._types.GenerateContentConfig(**config_kwargs) if config_kwargs else None
        kwargs = {"model": self.MODEL, "contents": prompt}
        if generate_config:
            kwargs["config"] = generate_config

        max_retries = 3
        base_delay = 2.0

        for attempt in range(max_retries + 1):
            try:
                response = self._client.models.generate_content(**kwargs)
                return response.text
            except Exception as e:
                err_str = str(e)
                is_transient = ("503" in err_str and "UNAVAILABLE" in err_str) or ("429" in err_str)
                
                if attempt < max_retries and is_transient:
                    delay = (base_delay ** attempt) + random.uniform(0, 1)
                    retry_match = re.search(r"'retryDelay':\s*'(\d+(\.\d+)?)s'", err_str)
                    if retry_match:
                        delay = max(delay, float(retry_match.group(1)))
                    time.sleep(delay)
                    continue
                    
                raise HTTPException(status_code=503, detail=f"Gemini API Error: {err_str}")


# ─────────────────────── Factory ───────────────────────────────────────────

def get_ai_provider() -> AIProvider:
    """
    Returns GeminiProvider if GEMINI_API_KEY is set, MockProvider otherwise.
    Call this at request time — never cache at module load.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if api_key:
        return GeminiProvider(api_key)
    return MockProvider()
