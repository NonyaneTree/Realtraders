from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from email.mime.text import MIMEText
import smtplib
import random

from config import DATABASE_URI, EMAIL, APP_PASSWORD
from models import db, User

app = Flask(__name__)
CORS(app)

# Database setup
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Verification storage
verification_store = {}

@app.before_first_request
def create_tables():
    db.create_all()

@app.route('/')
def index():
    return render_template('index.html')

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

if __name__ == '__main__':
    app.run(debug=True)
