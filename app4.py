from flask import Flask, request, render_template, jsonify
from flask_cors import CORS
import os
from werkzeug.utils import secure_filename
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize app
app = Flask(__name__)
CORS(app)  # ← Enable CORS for all domains (or configure if needed)

# Configurations
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Set OpenAI key from environment
openai.api_key = os.getenv("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")

# File type check
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Route: home page
@app.route('/')
def index():
    return render_template('xio.html')

# Route: image upload
@app.route('/upload', methods=['POST'])
def upload():
    if 'image' not in request.files:  # ← must match input name from HTML
        return jsonify({'error': 'No image part'}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # Placeholder OpenAI image processing
        return jsonify({'description': f'Image {filename} uploaded successfully'}), 200
    else:
        return jsonify({'error': 'Invalid file type'}), 400

# Render needs this for Gunicorn to find your app
if __name__ == '__main__':
    app.run(debug=True)
