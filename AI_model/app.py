from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from tensorflow.keras.models import load_model
import os
import requests
from dotenv import load_dotenv
import time
from typing import Dict

# Load environment variables
load_dotenv()
HF_API_TOKEN = os.getenv("HF_API_TOKEN")
GEMINI_API_KEY = "AIzaSyCOk7MFwGHQHY8u6uCqD5wX684p-WB7F9w "

# Load the pre-trained gesture model
model = load_model('AI_model/model.h5')
unique_labels = ["hello", "thank you", "no gesture", "what", "your", "name"]

# Constants
SEQUENCE_LENGTH = 120  # Length of sequences for prediction

app = Flask(__name__)

# Configure CORS
CORS(app, resources={r"/*": {"origins": "*", "methods": ["POST"], "allow_headers": ["Content-Type"]}})

class GeminiEnhancer:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.endpoint = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent"

        self.system_prompt = """
        You are a helpful language assistant. Your job is to improve the clarity, grammar, and tone of short texts.

        Instructions:
        - First, correct any spelling or grammatical issues.
        - Then, if requested, rewrite the sentence using the specified tone.
        - Do not add or remove meaning from the original text.
        - Only respond with the corrected or rewritten sentence, no explanations.
        """.strip()

        self.tone_prompts = {
            "FRIENDLY": "Make this sound friendly and approachable: ",
            "PROFESSIONAL": "Make this sound formal and professional for business communication: ",
            "CASUAL": "Make this sound casual and conversational: ",
            "PERSUASIVE": "Make this more persuasive and compelling: ",
            "ANGRY": "Make this sound angry and frustrated: ",
            "EXCITED": "Make this sound excited and enthusiastic: ",
            "SARCASTIC": "Make this sound sarcastic and ironic: "
        }

    def enhance_text(self, text: str, tone: str = "FRIENDLY") -> Dict:
        if not text.strip():
            return {"error": "Input is empty", "original": text}

        # Normalize the tone input
        tone = tone.upper()
        if tone not in self.tone_prompts:
            tone = "FRIENDLY"

        # Step 1: Grammar correction
        grammar_prompt = f"Correct grammar and improve clarity while keeping the original meaning:\n{text}"
        grammar_result = self._call_gemini(grammar_prompt)
        if not grammar_result["success"]:
            return {"error": grammar_result["error"], "original": text}

        grammar_corrected = grammar_result["output"]

        # Step 2: Tone adjustment
        tone_instruction = self.tone_prompts.get(tone, self.tone_prompts["FRIENDLY"])
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

# Initialize the enhancer
text_enhancer = GeminiEnhancer()

@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint for gesture prediction"""
    data = request.get_json()
    new_data = data.get('sensor_data', [])

    if len(new_data) != SEQUENCE_LENGTH * 12:
        return jsonify({"error": f"Invalid data format, expected {SEQUENCE_LENGTH * 12} values, got {len(new_data)}."}), 400
    
    data_buffer = np.array(new_data).reshape((1, SEQUENCE_LENGTH, 12))

    try:
        prediction = model.predict(data_buffer)
        predicted_class = np.argmax(prediction, axis=1)
        result = unique_labels[predicted_class[0]]
        return jsonify({"prediction": result})

    except Exception as e:
        return jsonify({"error": f"Error in prediction: {str(e)}"}), 500

@app.route('/enhance-text', methods=['POST'])
def enhance_text():
    """Enhanced text processing with grammar correction and tone adjustment"""
    data = request.get_json()
    text = data.get('text', '')
    tone = data.get('tone', 'FRIENDLY').upper()
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        result = text_enhancer.enhance_text(text, tone)
        
        if result.get("error"):
            return jsonify({
                "error": result["error"],
                "original_text": text,
                "grammar_corrected": text,
                "tone_adjusted": text
            }), 500
            
        return jsonify({
            "original": result["original"],
            "grammar_corrected": result["grammar_corrected"],
            "tone_adjusted": result["tone_adjusted"],
            "success": True
        })
    except Exception as e:
        return jsonify({
            "error": f"Text enhancement failed: {str(e)}",
            "original_text": text,
            "grammar_corrected": text,
            "tone_adjusted": text
        }), 500

if __name__ == '__main__':
    app.run(debug=True)