from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import smtplib
import random
from email.mime.text import MIMEText

app = Flask(__name__)
CORS(app)  # Allow all origins

# Temporary in-memory store
verification_store = {}

EMAIL = "nonyaneinvestmenttree@gmail.com"
APP_PASSWORD = "qiku gpty uxso ygwi"  # Google App Password

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/send-code', methods=['POST'])
def send_code():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"message": "No email provided."}), 400

    code = str(random.randint(100000, 999999))
    verification_store[email] = code

    try:
        msg = MIMEText(f"Your Real Traders verification code is: {code}")
        msg['Subject'] = 'Your Verification Code'
        msg['From'] = EMAIL
        msg['To'] = email

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(EMAIL, APP_PASSWORD)
            smtp.send_message(msg)

        return jsonify({"message": "✅ Verification code sent!"})

    except Exception as e:
        print("Error sending email:", e)
        return jsonify({"message": "❌ Failed to send verification code."}), 500

@app.route('/verify-code', methods=['POST'])
def verify_code():
    data = request.get_json()
    email = data.get('email')
    code = data.get('code')

    if email in verification_store and verification_store[email] == code:
        return jsonify({"verified": True})
    else:
        return jsonify({"verified": False})

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    # You can store user data in DB here
    print("User registered:", data)
    return jsonify({"message": "Registration successful!"})

if __name__ == '__main__':
    app.run(debug=True)
