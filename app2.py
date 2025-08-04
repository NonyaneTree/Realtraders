from flask import Flask, request, jsonify, render_template, session, redirect, url_for
import psycopg2
from datetime import datetime
import os

app = Flask(__name__)

# Use secret key from environment variable on Render for security
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'fallback-secret-key')

DATABASE_URL = os.environ.get('DATABASE_URL', "postgresql://real_traders_user:9hqUS4p6Vx7Tgam40WJ0y8hIUmct9al@dpg-d274k83uibrs73cup0j0-a/real_traders")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

@app.route('/')
def index():
    if 'user_id' in session:
        return jsonify({'message': 'Already logged in', 'redirect': '/dashboard'})
    return render_template('login.html')  # You provide this template

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json(force=True)
    email = data.get('email')
    password = data.get('password')

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, username, email, password FROM traders WHERE email = %s", (email,))
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user and user[3] == password:
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['email'] = user[2]
            update_last_login(user[0])
            return jsonify({'status': 'success', 'message': 'Login successful', 'redirect': '/dashboard'})
        else:
            return jsonify({'status': 'error', 'message': 'Invalid email or password'}), 401

    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Database error: {str(e)}'}), 500

def update_last_login(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE traders SET last_login = %s WHERE id = %s", (datetime.now(), user_id))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error updating last login: {e}")

@app.route('/recover-password', methods=['POST'])
def recover_password():
    data = request.get_json(force=True)
    email = data.get('email')
    secret = data.get('secret')

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT password FROM traders WHERE email = %s AND secret = %s", (email, secret))
        result = cur.fetchone()
        cur.close()
        conn.close()

        if result:
            return jsonify({'status': 'success', 'password': f'Your password is: {result[0]}'})
        else:
            return jsonify({'status': 'error', 'message': 'Email and secret answer do not match'}), 401

    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Database error: {str(e)}'}), 500

@app.route('/logout')
def logout():
    session.clear()
    return jsonify({'message': 'Logged out', 'redirect': '/'})

if __name__ == '__main__':
    # On Render, port is provided by env PORT variable
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
