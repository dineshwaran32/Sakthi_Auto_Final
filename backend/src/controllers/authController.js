const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendVerification, checkVerification } = require('../services/twilioService');

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const login = async (req, res) => {
  try {
    const { employeeNumber, otp } = req.body;
    
    // Simple OTP validation (in production, use proper OTP service)
    if (otp !== '1234') {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Find user by employee number
    const user = await User.findOne({ employeeNumber, isActive: true });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid employee number'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.profile
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user.profile
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

const logout = async (req, res) => {
  try {
    // In a real app, you might want to blacklist the token
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    });
  }
};

// Send OTP to user's mobile number
const sendOtp = async (req, res) => {
  try {
    const { employeeNumber } = req.body;
    if (!employeeNumber) {
      return res.status(400).json({ success: false, message: 'Employee number is required' });
    }
    const user = await User.findOne({ employeeNumber, isActive: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    await sendVerification({ to: user.mobileNumber });
    res.json({ success: true, message: 'OTP sent to registered mobile number' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
};

// Verify OTP and login
const verifyOtp = async (req, res) => {
  try {
    const { employeeNumber, otp } = req.body;
    if (!employeeNumber || !otp) {
      return res.status(400).json({ success: false, message: 'Employee number and OTP are required' });
    }
    const user = await User.findOne({ employeeNumber, isActive: true });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    const result = await checkVerification({ to: user.mobileNumber, code: otp });
    if (result.status !== 'approved') {
      return res.status(401).json({ success: false, message: 'Invalid or expired OTP' });
    }
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    // Generate token
    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.profile
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};

module.exports = {
  login,
  getProfile,
  logout,
  sendOtp,
  verifyOtp
};