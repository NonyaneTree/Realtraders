from flask import Flask, request, jsonify, send_from_directory
import cv2
import numpy as np
import openai
import os
import json
import base64
import logging
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Initialize OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Setup logging
logging.basicConfig(level=logging.INFO)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/analyze', methods=['POST'])
def analyze_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        
        # Process image with ChatGPT analysis
        annotated_image, analysis = process_image(filepath)
        
        return jsonify({
            'original': filename,
            'annotated': os.path.basename(annotated_image),
            'analysis': analysis
        })
    
    return jsonify({'error': 'File type not allowed'}), 400

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

def process_image(image_path):
    img = cv2.imread(image_path)
    
    # Get analysis first
    analysis_text = get_chatgpt_analysis(image_path)
    try:
        analysis = json.loads(analysis_text)
    except json.JSONDecodeError:
        analysis = {"zones": [], "signals": []}  # fallback

    # Draw zones
    for zone in analysis.get("zones", []):
        x1, y1, x2, y2 = zone["coords"]
        zone_type = zone.get("type", "")
        color = (128, 128, 128)  # default fallback gray
        
        if zone_type == "support" or zone_type == "resistance":
            color = (139, 69, 19)  # brown
        elif zone_type == "retest":
            color = (0, 165, 255)  # orange
            cv2.putText(img, "Retest", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        elif zone_type == "take_profit":
            color = (0, 255, 0)  # green
            cv2.putText(img, "TP", (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
        
        cv2.line(img, (x1, y1), (x2, y2), color, 2)

    # Draw signals
    for signal in analysis.get("signals", []):
        x, y = signal["coords"]
        arrow = "↑" if signal["direction"] == "buy" else "↓"
        color = (0, 255, 0) if signal["direction"] == "buy" else (0, 0, 255)  # green for buy, red for sell
        cv2.putText(img, arrow, (x, y), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

    # Save annotated image
    annotated_path = f"annotated_{os.path.basename(image_path)}"
    annotated_full_path = os.path.join(app.config['UPLOAD_FOLDER'], annotated_path)
    cv2.imwrite(annotated_full_path, img)
    
    return annotated_path, analysis

def get_chatgpt_analysis(image_path):
    # Convert image to base64
    with open(image_path, "rb") as image_file:
        base64_image = base64.b64encode(image_file.read()).decode('utf-8')
    
    prompt = """
    Analyze this trading chart and return JSON with:
    - zones: array of {type: "support/resistance/retest/take_profit", coords: [x1,y1,x2,y2]}
    - signals: array of {direction: "buy/sell", coords: [x,y]}
    
    Use these guidelines:
    1. Support/Resistance: brown lines between important price levels
    2. Retest: orange lines where price might retest a level
    3. Take Profit: green lines at target areas
    4. Buy/Sell Signals: arrows at entry points
    
    Return ONLY valid JSON like this:
    {
        "zones": [
            {"type": "support", "coords": [100,200,300,200]},
            {"type": "retest", "coords": [150,250,250,250]}
        ],
        "signals": [
            {"direction": "buy", "coords": [200,300]}
        ]
    }
    """
    
    response = openai.ChatCompletion.create(
        model="gpt-4-vision-preview",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": f"data:image/jpeg;base64,{base64_image}",
                    },
                ],
            }
        ],
        max_tokens=1000,
    )
    
    return response.choices[0].message.content

if __name__ == '__main__':
    app.run(debug=True)
