from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from email.mime.text import MIMEText
import smtplib
import random

# === CONFIGURATION ===
DATABASE_URI = ""
EMAIL = "nonyaneinvestmenttree@gmail.com"  # 🔁 Replace with your Gmail
APP_PASSWORD = "qiku gpty uxso ygwi"  # 🔁 Replace with your Gmail App Password

# === FLASK APP SETUP ===
app = Flask(__name__)
CORS(app)

# === DATABASE SETUP ===
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# === DATABASE MODEL ===
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    experience = db.Column(db.String(100))
    secret = db.Column(db.String(100))
    password = db.Column(db.String(200), nullable=False)

# === CREATE TABLES BEFORE FIRST REQUEST ===
@app.before_first_request
def create_tables():
    db.create_all()

# === IN-MEMORY VERIFICATION STORE ===
verification_store = {}

# === ROUTES ===
@app.route('/')
def index():
    return render_template('index.html')  # Optional: index.html in templates folder

@app.route('/send-code', methods=['POST'])
def send_code():
    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({"message": "Email required"}), 400

    code = str(random.randint(100000, 999999))
    verification_store[email] = code

    try:
        msg = MIMEText(f"Your Real Traders verification code is: {code}")
        msg['Subject'] = 'Email Verification Code'
        msg['From'] = EMAIL
        msg['To'] = email

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL, APP_PASSWORD)
            server.send_message(msg)

        return jsonify({"message": "✅ Code sent!"})
    except Exception as e:
        print(e)
        return jsonify({"message": "❌ Failed to send email."}), 500

@app.route('/verify-code', methods=['POST'])
def verify_code():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')

    if verification_store.get(email) == code:
        return jsonify({"verified": True})
    return jsonify({"verified": False})

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    try:
        new_user = User(
            username=data['username'],
            email=data['email'],
            experience=data['experience'],
            secret=data['secret'],
            password=data['password']
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": f"🎉 Registered {new_user.username}!"})
    except Exception as e:
        print(e)
        return jsonify({"message": "❌ Registration failed."}), 500

# === RUN ===
if __name__ == '__main__':
    app.run(debug=True)
