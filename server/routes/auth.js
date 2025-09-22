const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { generateToken, generateVerificationToken, verifySpecialToken } = require('../utils/jwt');
const { validateUserRegistration, validateUserLogin } = require('../utils/validation');
const { authenticateFirebase, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      isEmailVerified: false,
      isProfileComplete: false
    });

    await user.save();

    // Generate tokens
    const token = generateToken(user._id, user.role);
    const verificationToken = generateVerificationToken(user._id, user.email);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      verificationToken,
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.role);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/firebase-register
// @desc    Register with Firebase token
// @access  Public
router.post('/firebase-register', authenticateFirebase, async (req, res) => {
  try {
    const { firstName, lastName, role, phone } = req.body;
    const firebaseUser = req.firebaseUser;

    // Check if user already exists
    let user = await User.findOne({ 
      $or: [
        { email: firebaseUser.email },
        { firebaseUid: firebaseUser.uid }
      ]
    });

    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({
      email: firebaseUser.email,
      firstName,
      lastName,
      role,
      phone,
      firebaseUid: firebaseUser.uid,
      isEmailVerified: firebaseUser.email_verified || false,
      isProfileComplete: false
    });

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Firebase registration error:', error);
    res.status(500).json({ message: 'Server error during Firebase registration' });
  }
});

// @route   POST /api/auth/firebase-login
// @desc    Login with Firebase token
// @access  Public
router.post('/firebase-login', authenticateFirebase, async (req, res) => {
  try {
    const firebaseUser = req.firebaseUser;

    // Find user by Firebase UID or email
    let user = await User.findOne({
      $or: [
        { firebaseUid: firebaseUser.uid },
        { email: firebaseUser.email }
      ]
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'User not found. Please register first.',
        requiresRegistration: true
      });
    }

    // Update Firebase UID if not set
    if (!user.firebaseUid) {
      user.firebaseUid = firebaseUser.uid;
    }

    // Update email verification status
    if (firebaseUser.email_verified && !user.isEmailVerified) {
      user.isEmailVerified = true;
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(500).json({ message: 'Server error during Firebase login' });
  }
});

// @route   POST /api/auth/verify-email
// @desc    Verify user email
// @access  Public
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    // Verify token
    const decoded = verifySpecialToken(token, 'email_verification');
    
    // Find and update user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.email !== decoded.email) {
      return res.status(400).json({ message: 'Token email mismatch' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    user.isEmailVerified = true;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Email verification error:', error);
    if (error.message === 'Invalid or expired token') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error during email verification' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = req.user.toObject();
    delete user.password;
    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const newToken = generateToken(req.user._id, req.user.role);
    res.json({ token: newToken });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Server error during token refresh' });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Update last active time
    req.user.lastActive = new Date();
    await req.user.save();

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});

module.exports = router;
