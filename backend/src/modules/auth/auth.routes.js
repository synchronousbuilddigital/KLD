const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const {
  sendSignupOtp,
  verifySignupOtp,
  register,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  googleLogin,
} = require('./auth.controller');

// Validation rules
const registerValidation = [
  body('email').isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('fullName').optional().trim().isLength({ max: 50 }),
];

const loginValidation = [
  body('email').isEmail().withMessage('Invalid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// Routes
router.post('/send-signup-otp', body('email').isEmail(), sendSignupOtp);
router.post('/verify-signup-otp', verifySignupOtp);
router.post('/register', registerValidation, register);
router.post('/verify-email', verifyEmail);
router.post('/login', loginValidation, login);
router.post('/google', googleLogin);
router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.post('/forgot-password', body('email').isEmail(), forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
