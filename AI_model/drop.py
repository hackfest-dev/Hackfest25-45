import os
import requests
from dotenv import load_dotenv
import time
from typing import Dict

load_dotenv()

class GeminiEnhancer:
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        self.endpoint = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent"

        self.system_prompt = """
        You are a helpful language assistant. Your job is to improve the clarity, grammar, and tone of short texts.

        Instructions:
        - First, correct any spelling or grammatical issues.
        - Then, if requested, rewrite the sentence using the specified tone (e.g. friendly, professional, casual, persuasive).
        - Do not add or remove meaning from the original text.
        - Only respond with the corrected or rewritten sentence, no explanations.
        """.strip()

        self.tone_prompts = {
            "friendly": "Make this sound friendly: ",
            "professional": "Make this sound professional: ",
            "casual": "Make this sound casual: ",
            "persuasive": "Make this more persuasive: "
        }

    def enhance_text(self, text: str, tone: str = "friendly") -> Dict:
        if not text.strip():
            return {"error": "Input is empty", "original": text}

        # Step 1: Grammar correction
        grammar_prompt = f"Correct grammar and improve clarity:\n{text}"
        grammar_result = self._call_gemini(grammar_prompt)
        if not grammar_result["success"]:
            return {"error": grammar_result["error"], "original": text}

        grammar_corrected = grammar_result["output"]

        # Step 2: Tone adjustment
        tone_instruction = self.tone_prompts.get(tone, self.tone_prompts["friendly"])
        tone_prompt = f"{tone_instruction}{grammar_corrected}"
        tone_result = self._call_gemini(tone_prompt)
        if not tone_result["success"]:
            return {
                "error": tone_result["error"],
                "original": text,
                "grammar_corrected": grammar_corrected
            }

        return {
            "original": text,
            "grammar_corrected": grammar_corrected,
            "tone_adjusted": tone_result["output"],
            "success": True
        }

    def _call_gemini(self, prompt: str) -> Dict:
        try:
            response = requests.post(
                f"{self.endpoint}?key={self.api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [
                        {
                            "role": "user",
                            "parts": [{"text": self.system_prompt}]
                        },
                        {
                            "role": "user",
                            "parts": [{"text": prompt}]
                        }
                    ]
                },
                timeout=15
            )

            if response.status_code == 200:
                output = response.json()["candidates"][0]["content"]["parts"][0]["text"]
                return {"success": True, "output": output.strip()}
            else:
                return {
                    "success": False,
                    "error": f"API error {response.status_code}: {response.text}"
                }

        except requests.RequestException as e:
            return {"success": False, "error": str(e)}


# Example usage
if __name__ == "__main__":
    enhancer = GeminiEnhancer()

    test_cases = [
        ("your name what", "very professional"),
        ("hello thank you", "professional"),
        ("your name", "friendly"),
        ("whats up", "casual")
    ]

    for text, tone in test_cases:
        print(f"\nProcessing: '{text}' with {tone} tone")
        start_time = time.time()
        result = enhancer.enhance_text(text, tone)
        elapsed = time.time() - start_time

        if result.get("error"):
            print(f"Error: {result['error']}")
        else:
            print(f" Original: {result['original']}")
            print(f" Grammar corrected: {result['grammar_corrected']}")
            print(f" Tone adjusted: {result['tone_adjusted']}")

        print(f"⏱️ Took {elapsed:.2f} seconds")
