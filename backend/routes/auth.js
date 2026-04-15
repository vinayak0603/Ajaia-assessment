const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { BrevoClient } = require('@getbrevo/brevo');

// Brevo API configuration (v5 SDK)
const brevoClient = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

const sendOtpEmail = async (email, otp) => {
    try {
        await brevoClient.transactionalEmails.sendTransacEmail({
            subject: "Verify your account - Ajaia Docs",
            htmlContent: `
                <html>
                    <body>
                        <h1>Welcome to Ajaia Docs</h1>
                        <p>Your OTP for verification is: <strong>${otp}</strong></p>
                        <p>This OTP will expire in 10 minutes.</p>
                    </body>
                </html>
            `,
            sender: { name: "Ajaia Docs", email: process.env.SMTP_FROM },
            to: [{ email: email }]
        });
        console.log(`OTP sent successfully to ${email}`);
    } catch (err) {
        console.error("Error sending email via Brevo:", err);
        throw new Error("Failed to send verification email");
    }
};

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user = new User({
            name,
            email,
            password,
            otp,
            otpExpires
        });

        await user.save();
        await sendOtpEmail(email, otp);

        res.status(201).json({ message: 'User registered. Please check your email for OTP.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'User already verified' });
        }

        if (user.otp !== otp || user.otpExpires < Date.now()) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        res.json({ message: 'Account verified successfully. You can now login.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ error: 'Account not verified. Please register again or verify your account.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { email: user.email, id: user._id } }); // Include ID for frontend comparisons
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
