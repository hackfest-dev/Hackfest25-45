from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from tensorflow.keras.models import load_model
import os
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
HF_API_TOKEN = os.getenv("HF_API_TOKEN")

# Load the pre-trained gesture model
model = load_model('AI_model/model.h5')  # Update with your model's path
unique_labels = ["hello", "thank you", "no gesture", "what", "your", "name"]

# Grammar correction constants
GRAMMAR_MODEL_ID = "vennify/t5-base-grammar-correction"
GRAMMAR_API_URL = f"https://api-inference.huggingface.co/models/{GRAMMAR_MODEL_ID}"
GRAMMAR_HEADERS = {"Authorization": f"Bearer {HF_API_TOKEN}"}

# Other constants
SEQUENCE_LENGTH = 120  # Length of sequences for prediction (120 samples)

app = Flask(__name__)

# Configure CORS
CORS(app, resources={r"/*": {"origins": "*", "methods": ["POST"], "allow_headers": ["Content-Type"]}})

def correct_grammar(text, max_retries=3):
    """
    Corrects grammar of the input text using Hugging Face API.
    
    Args:
        text (str): Text to be corrected
        max_retries (int): Maximum number of retries if API call fails
        
    Returns:
        str: Corrected text or original text if error occurs
    """
    payload = {
        "inputs": f"grammar: {text}"
    }
    
    for attempt in range(max_retries):
        try:
            response = requests.post(GRAMMAR_API_URL, headers=GRAMMAR_HEADERS, json=payload)
            response.raise_for_status()  # Raises exception for 4XX/5XX errors
            
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                return result[0].get("generated_text", text)
            return text
            
        except requests.exceptions.RequestException as e:
            print(f"Attempt {attempt + 1} failed: {str(e)}")
            if attempt == max_retries - 1:
                print("Max retries reached. Returning original text.")
                return text

@app.route('/predict', methods=['POST'])
def predict():
    """Endpoint for gesture prediction"""
    # Get the sensor data from the request
    data = request.get_json()

    # Validate the incoming data
    new_data = data.get('sensor_data', [])

    # Ensure we have exactly SEQUENCE_LENGTH samples of 12 values each
    if len(new_data) != SEQUENCE_LENGTH * 12:
        return jsonify({"error": f"Invalid data format, expected {SEQUENCE_LENGTH * 12} values, got {len(new_data)}."}), 400
    
    # Reshape the data to match the model's expected input (1, SEQUENCE_LENGTH, 12)
    data_buffer = np.array(new_data).reshape((1, SEQUENCE_LENGTH, 12))

    try:
        # Make the prediction
        prediction = model.predict(data_buffer)
        predicted_class = np.argmax(prediction, axis=1)

        # Output the predicted class
        result = unique_labels[predicted_class[0]]
        return jsonify({"prediction": result})

    except Exception as e:
        return jsonify({"error": f"Error in prediction: {str(e)}"}), 500

@app.route('/correct-grammar', methods=['POST'])
def grammar_correction():
    """Endpoint for grammar correction"""
    data = request.get_json()
    text = data.get('text', '')
    
    if not text:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        corrected_text = correct_grammar(text)
        return jsonify({
            "original_text": text,
            "corrected_text": corrected_text
        })
    except Exception as e:
        return jsonify({
            "error": f"Grammar correction failed: {str(e)}",
            "original_text": text,
            "corrected_text": text  # Return original as fallback
        }), 500

if __name__ == '__main__':
    app.run(debug=True)