const express = require('express');
const { validateRequest, schemas } = require('../middleware/validation');
const { auth } = require('../middleware/auth');
const { login, getProfile, logout, sendOtp, verifyOtp } = require('../controllers/authController');
// const rateLimit = require('express-rate-limit');

const router = express.Router();

// More lenient rate limiter for auth endpoints - DISABLED FOR DEVELOPMENT
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: process.env.NODE_ENV === 'development' ? 100 : 20, // Allow more login attempts in development
//   message: {
//     success: false,
//     message: 'Too many login attempts, please try again later.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateRequest(schemas.login), login);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, getProfile);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', auth, logout);

// @route   POST /api/auth/send-otp
// @desc    Send OTP to employee's registered mobile
// @access  Public
router.post('/send-otp', validateRequest(schemas.sendOtp), sendOtp);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login
// @access  Public
router.post('/verify-otp', validateRequest(schemas.verifyOtp), verifyOtp);

module.exports = router;