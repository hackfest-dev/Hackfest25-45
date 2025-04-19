from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from tensorflow.keras.models import load_model
import os
import requests
from dotenv import load_dotenv
from typing import Dict, Any  # Added Any for type hints

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyCOk7MFwGHQHY8u6uCqD5wX684p-WB7F9w")

# Load the pre-trained gesture model
model = load_model('AI_model/model.h5')
unique_labels = ["hello", "thank you", "no gesture", "what", "your", "name"]

# Constants
SEQUENCE_LENGTH = 120
FEATURES_PER_FRAME = 9  # accel (3) + gravity (3) + angular velocity (3)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["POST"], "allow_headers": ["Content-Type"]}})

class GeminiEnhancer:
    def __init__(self):
        self.api_key = GEMINI_API_KEY
        self.endpoint = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent"

        self.system_prompt = """
        You are a helpful language assistant. Your job is to improve the clarity, grammar, and tone of short texts.
        Instructions:
        - First, correct any spelling or grammatical issues.
        - Then, rewrite the sentence using the specified tone.
        - Do not add or remove meaning from the original text.
        - Only respond with the corrected sentence, no explanations.
        """.strip()

        self.tone_prompts = {
            "FRIENDLY": "Make this sound friendly and approachable: ",
            "PROFESSIONAL": "Make this sound formal and professional: ",
            "CASUAL": "Make this sound casual and conversational: ",
            "PERSUASIVE": "Make this more persuasive and compelling: "
        }

    def enhance_text(self, text: str, tone: str = "FRIENDLY") -> Dict[str, Any]:
        if not text.strip():
            return {"error": "Input is empty", "success": False}

        tone = tone.upper()
        if tone not in self.tone_prompts:
            tone = "FRIENDLY"

        # Combined grammar correction and tone adjustment in one step
        prompt = f"{self.system_prompt}\n\nOriginal text: {text}\nPlease correct grammar and make it {tone.lower()}:"
        
        try:
            result = self._call_gemini(prompt)
            if not result["success"]:
                return result
            
            return {
                "original": text,
                "enhanced": result["output"],
                "success": True
            }
            
        except Exception as e:
            return {
                "error": f"Enhancement failed: {str(e)}",
                "success": False
            }

    def _call_gemini(self, prompt: str) -> Dict[str, Any]:
        try:
            response = requests.post(
                f"{self.endpoint}?key={self.api_key}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                },
                timeout=15
            )
            response.raise_for_status()
            
            output = response.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
            return {"success": True, "output": output}
            
        except requests.RequestException as e:
            return {"success": False, "error": str(e)}

text_enhancer = GeminiEnhancer()

@app.route('/predict', methods=['POST'])
def predict():
    """Gesture prediction endpoint"""
    data = request.get_json()
    sensor_data = data.get('sensor_data', [])
    
    if len(sensor_data) != SEQUENCE_LENGTH * FEATURES_PER_FRAME:
        return jsonify({"error": f"Expected {SEQUENCE_LENGTH * FEATURES_PER_FRAME} values, got {len(sensor_data)}"}), 400
    
    try:
        data_buffer = np.array(sensor_data).reshape((1, SEQUENCE_LENGTH, FEATURES_PER_FRAME))
        prediction = model.predict(data_buffer)
        predicted_class = unique_labels[np.argmax(prediction)]
        return jsonify({"prediction": predicted_class})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/enhance-text', methods=['POST'])
def handle_enhance_text():
    """Enhanced text processing endpoint"""
    data = request.get_json()
    text = data.get('text', '').strip()
    tone = data.get('tone', 'FRIENDLY').upper()
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    result = text_enhancer.enhance_text(text, tone)
    if not result.get("success"):
        return jsonify({
            "error": result.get("error", "Enhancement failed"),
            "original": text,
            "success": False
        }), 400
    
    return jsonify({
        "original": result["original"],
        "enhanced": result["enhanced"],
        "success": True
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)