from flask import Flask, request, jsonify, session, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail, Message
from datetime import datetime
import random
import os
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = "postgresql://real_traders_user:9hqUS4p6Vx7T4gam40WJ0y8hIUmct9al@dpg-d274k83uibrs73cup0j0-a/real_traders"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["SECRET_KEY"] = "qiku gpty uxso ygwi"
app.config["MAIL_SERVER"] = "smtp.gmail.com"
app.config["MAIL_PORT"] = 587
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = "nonyaneinvestmenttree@gmail.com"
app.config["MAIL_PASSWORD"] = os.environ.get("EMAIL_PASSWORD")  # Use env var for security

# Initialize extensions
db = SQLAlchemy(app)
mail = Mail(app)

# Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), unique=True, nullable=False)
    name = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.String(200), nullable=False)
    verified = db.Column(db.Boolean, default=False)
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class VerificationCode(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100), nullable=False)
    code = db.Column(db.String(6), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Routes
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/send-code", methods=["POST"])
def send_code():
    email = request.json.get("email")
    if not email:
        return jsonify({"success": False, "message": "Email is required"}), 400

    code = str(random.randint(100000, 999999))
    verification = VerificationCode(email=email, code=code)
    db.session.add(verification)
    db.session.commit()

    msg = Message("Your Verification Code", recipients=[email])
    msg.body = f"Your verification code is: {code}"
    mail.send(msg)

    return jsonify({"success": True, "message": "Verification code sent"})


@app.route("/register", methods=["POST"])
def register():
    name = request.json.get("name")
    email = request.json.get("email")
    password = request.json.get("password")
    code = request.json.get("code")

    if not all([name, email, password, code]):
        return jsonify({"success": False, "message": "Missing fields"}), 400

    latest_code = VerificationCode.query.filter_by(email=email).order_by(VerificationCode.created_at.desc()).first()
    if not latest_code or latest_code.code != code:
        return jsonify({"success": False, "message": "Invalid or expired code"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "User already exists"}), 400

    user = User(name=name, email=email, verified=True)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    return jsonify({"success": True, "message": "User registered successfully"})


@app.route("/login", methods=["POST"])
def login():
    email = request.json.get("email")
    password = request.json.get("password")

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({"success": False, "message": "Invalid credentials"}), 401

    session["user_id"] = user.id
    return jsonify({"success": True, "message": "Logged in successfully"})

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
