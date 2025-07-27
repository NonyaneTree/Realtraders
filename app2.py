from flask import Flask, request, jsonify, send_from_directory
import requests
import re
import os

app = Flask(__name__)

BOT_TOKEN = "7271224033:AAH22jbuHkyvJQuiP_HhqMeN9NjADo6J7vk"
CHAT_ID = "-1002826854422"
TELEGRAM_API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}/getUpdates"

def fetch_telegram_messages():
    try:
        res = requests.get(TELEGRAM_API_URL)
        res.raise_for_status()
        data = res.json()
        messages = [item['message']['text'] for item in data.get('result', []) if 'message' in item and 'text' in item['message']]
        return messages
    except Exception as e:
        print(f"Error fetching Telegram messages: {e}")
        return []

@app.route('/')
def serve_login():
    return send_from_directory('Templates2', 'login.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password required"}), 400

    messages = fetch_telegram_messages()
    for msg in messages:
        if email in msg and password in msg:
            return jsonify({"status": "success", "message": "Login successful"})

    return jsonify({"status": "error", "message": "Invalid email or password"}), 401

# Optional: serve realtraders.html if you want to serve from here
@app.route('/realtraders.html')
def serve_realtraders():
    return send_from_directory('static', 'realtraders.html')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
