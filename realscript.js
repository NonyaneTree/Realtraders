require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// Database Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Change to your DB password
    database: 'realtraders_db'
});

db.connect(err => {
    if (err) {
        console.error('Database connection failed: ' + err.stack);
        return;
    }
    console.log('Connected to database');
});

// **User Registration**
app.post('/register', (req, res) => {
    const { name, email, country, password } = req.body;
    const query = "INSERT INTO users (name, email, country, password_hash) VALUES (?, ?, ?, ?)";
    db.query(query, [name, email, country, password], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: "User registered", user_id: result.insertId });
    });
});

// **User Login**
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT id FROM users WHERE email = ? AND password_hash = ?";
    db.query(query, [email, password], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (result.length === 0) return res.status(401).json({ success: false, message: "Invalid credentials" });
        res.json({ success: true, message: "Login successful", user_id: result[0].id });
    });
});

// **Process Payment & Grant Access**
app.post('/payment', (req, res) => {
    const { user_id, amount, currency, transaction_id } = req.body;

    // Check if the transaction already exists
    db.query("SELECT id FROM payments WHERE transaction_id = ?", [transaction_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        if (result.length > 0) {
            return res.status(400).json({ success: false, message: "Duplicate transaction" });
        }

        // Insert payment record
        const insertQuery = "INSERT INTO payments (user_id, amount, currency, status, transaction_id) VALUES (?, ?, ?, 'successful', ?)";
        db.query(insertQuery, [user_id, amount, currency, transaction_id], (err) => {
            if (err) return res.status(500).json({ success: false, message: err.message });

            // Grant unlimited access for 720 hours (30 days)
            const expiryTime = new Date();
            expiryTime.setHours(expiryTime.getHours() + 720);
            const updateQuery = "UPDATE users SET access_expiry = ? WHERE id = ?";
            db.query(updateQuery, [expiryTime, user_id], (err) => {
                if (err) return res.status(500).json({ success: false, message: err.message });

                res.json({ success: true, message: "Payment successful, unlimited access granted", access_expiry: expiryTime });
            });
        });
    });
});

// **Check Access**
app.get('/check-access', (req, res) => {
    const { user_id } = req.query;
    const currentTime = new Date();

    db.query("SELECT access_expiry FROM users WHERE id = ?", [user_id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        if (result.length === 0) return res.status(404).json({ success: false, message: "User not found" });

        const hasUnlimitedAccess = result[0].access_expiry && new Date(result[0].access_expiry) > currentTime;

        res.json({
            unlimited_access: hasUnlimitedAccess,
            free_entries_remaining: hasUnlimitedAccess ? "Unlimited" : 4
        });
    });
});

// **Start Server**
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));