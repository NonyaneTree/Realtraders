from flask import Flask, request, jsonify, render_template, session, redirect, url_for
import psycopg2
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your-very-secure-secret-key-12345'  # Change this in production

# Database configuration
DATABASE_URL = "postgresql://real_traders_user:9hqUS4p6Vx7T4gam40WJ0y8hIUmct9al@dpg-d274k83uibrs73cup0j0-a/real_traders"

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

@app.route('/')
def index():
    return render_template('login.html')

@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Fetch user from database
        cur.execute("""
            SELECT id, username, email, password 
            FROM traders 
            WHERE email = %s
        """, (email,))
        
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user and check_password_hash(user[3], password):
            # Successful login
            session['user_id'] = user[0]
            session['username'] = user[1]
            session['email'] = user[2]
            
            # Update last login time
            update_last_login(user[0])
            
            return jsonify({
                'status': 'success',
                'message': 'Login successful',
                'redirect': '/dashboard'
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Invalid email or password'
            }), 401

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database error: {str(e)}'
        }), 500

def update_last_login(user_id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            UPDATE traders 
            SET last_login = %s 
            WHERE id = %s
        """, (datetime.now(), user_id))
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Error updating last login: {str(e)}")

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect('/')
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Fetch all user data
        cur.execute("""
            SELECT username, email, experience, secret, registration_date, last_login
            FROM traders 
            WHERE id = %s
        """, (session['user_id'],))
        
        user_data = cur.fetchone()
        cur.close()
        conn.close()

        if user_data:
            return render_template('dashboard.html', 
                               username=user_data[0],
                               email=user_data[1],
                               experience=user_data[2],
                               secret=user_data[3],
                               registration_date=user_data[4],
                               last_login=user_data[5])
        else:
            session.clear()
            return redirect('/')

    except Exception as e:
        session.clear()
        return redirect('/')

@app.route('/recover-password', methods=['POST'])
def recover_password():
    data = request.get_json()
    email = data.get('email')
    secret = data.get('secret')

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Verify email and secret answer
        cur.execute("""
            SELECT password 
            FROM traders 
            WHERE email = %s AND secret = %s
        """, (email, secret))
        
        result = cur.fetchone()
        cur.close()
        conn.close()

        if result:
            return jsonify({
                'status': 'success',
                'password': 'Your password is: ' + result[0]
            })
        else:
            return jsonify({
                'status': 'error',
                'message': 'Email and secret answer do not match'
            }), 401

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database error: {str(e)}'
        }), 500

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")
