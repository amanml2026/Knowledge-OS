import os
import google.generativeai as genai

class AIProvider:
    def chat(self, prompt: str, system_instruction: str = "") -> str:
        raise NotImplementedError

class MockProvider(AIProvider):
    def chat(self, prompt: str, system_instruction: str = "") -> str:
        return f"[MOCK AI - No API Key Set] Received prompt: {prompt[:100]}..."

class GeminiProvider(AIProvider):
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)
        self.model_name = 'gemini-1.5-pro-latest'

    def chat(self, prompt: str, system_instruction: str = "") -> str:
        try:
            if system_instruction:
                model = genai.GenerativeModel(self.model_name, system_instruction=system_instruction)
            else:
                model = genai.GenerativeModel(self.model_name)
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"[AI ERROR] {str(e)}"

def get_ai_provider() -> AIProvider:
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        return GeminiProvider(api_key)
    return MockProvider()
