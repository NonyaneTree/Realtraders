from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
import random
import smtplib
import ssl
from email.message import EmailMessage
import requests
from werkzeug.security import generate_password_hash, check_password_hash
import os

app = Flask(__name__)

# Render PostgreSQL configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get('DATABASE_URL', "postgresql://real_traders_user:9hqUS4p6Vx7T4gam40WJ0y8hIUmct9al@dpg-d274k83uibrs73cup0j0-a/real_traders")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

# Environment variables for secrets
BOT_TOKEN = os.environ.get('BOT_TOKEN', "7271224033:AAH22jbuHkyvJQuiP_HhqMeN9NjADo6J7vk")
CHAT_ID = os.environ.get('CHAT_ID', "-1002826854422")
EMAIL_SENDER = os.environ.get('EMAIL_SENDER', "nonyaneinvestmenttree@gmail.com")
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', "qiku gpty uxso ygwi")

verification_codes = {}

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    experience = db.Column(db.String(100))
    secret = db.Column(db.String(100))

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/send-code", methods=["POST"])
def send_code():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"message": "❌ Email is required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"message": "❌ This email is already registered."}), 400

    code = str(random.randint(100000, 999999))
    verification_codes[email] = code

    try:
        msg = EmailMessage()
        msg.set_content(f"Your verification code is: {code}")
        msg["Subject"] = "Your Real Traders Verification Code"
        msg["From"] = EMAIL_SENDER
        msg["To"] = email

        context = ssl.create_default_context()
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, context=context) as server:
            server.login(EMAIL_SENDER, EMAIL_PASSWORD)
            server.send_message(msg)

        return jsonify({"message": "📩 Code sent to your email!"}), 200

    except Exception as e:
        return jsonify({"message": f"❌ Failed to send email: {str(e)}"}), 500

@app.route("/verify-code", methods=["POST"])
def verify_code():
    data = request.get_json()
    email = data.get("email")
    code = data.get("code")

    if not email or not code:
        return jsonify({"verified": False, "message": "Email and code are required"})

    if verification_codes.get(email) == code:
        return jsonify({"verified": True, "message": "✅ Email verified!"})
    return jsonify({"verified": False, "message": "❌ Incorrect code."})

@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    
    required_fields = ["username", "email", "experience", "secret", "password"]
    if not all(field in data for field in required_fields):
        return jsonify({"status": "failed", "error": "All fields are required"}), 400

    username = data.get("username")
    email = data.get("email")
    experience = data.get("experience")
    secret = data.get("secret")
    password = data.get("password")

    if User.query.filter_by(email=email).first():
        return jsonify({"status": "failed", "error": "Email already registered"}), 400

    hashed_password = generate_password_hash(password)

    new_user = User(
        username=username,
        email=email,
        password=hashed_password,
        experience=experience,
        secret=secret
    )

    try:
        db.session.add(new_user)
        db.session.commit()

        message = (
            f"🧠 New Real Trader Registered!\n"
            f"Name: {username}\n"
            f"Email: {email}\n"
            f"Experience: {experience}\n"
            f"Secret: {secret}"
        )

        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        payload = {"chat_id": CHAT_ID, "text": message}
        requests.post(url, json=payload)

        return jsonify({"status": "success", "username": username}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "failed", "error": str(e)}), 500

@app.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"status": "failed", "error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        return jsonify({"status": "success", "username": user.username}), 200
    return jsonify({"status": "failed", "error": "Invalid credentials"}), 401

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))
