const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const { authLimiter } = require('../../middleware/rateLimiter');
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

/* ─── VALIDATION ENFORCEMENT MIDDLEWARE ─────────────────────────────── */
// Checks express-validator results and rejects with 400 if any rule failed
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

/* ─── VALIDATION RULE SETS ──────────────────────────────────────────── */
const emailRule = body('email')
  .isEmail().withMessage('Please enter a valid email address.')
  .normalizeEmail();

const registerValidation = [
  emailRule,
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.'),
  body('fullName').optional().trim().isLength({ max: 50 }).withMessage('Name must be 50 characters or less.'),
];

const loginValidation = [
  emailRule,
  body('password').notEmpty().withMessage('Password is required.'),
];

const resetPasswordValidation = [
  emailRule,
  body('otp').notEmpty().isLength({ min: 6, max: 6 }).withMessage('A valid 6-digit OTP is required.'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
];

/* ─── ROUTES ────────────────────────────────────────────────────────── */
router.post('/send-signup-otp',    authLimiter, emailRule, validateRequest, sendSignupOtp);
router.post('/verify-signup-otp',  authLimiter, verifySignupOtp);                    // Rate-limited to stop OTP brute-force
router.post('/register',           registerValidation, validateRequest, register);
router.post('/verify-email',       verifyEmail);
router.post('/login',              loginValidation, validateRequest, login);
router.post('/google',             googleLogin);
router.post('/refresh',            refresh);
router.post('/logout',             authenticate, logout);
router.post('/forgot-password',    authLimiter, emailRule, validateRequest, forgotPassword);
router.post('/reset-password',     authLimiter, resetPasswordValidation, validateRequest, resetPassword);

module.exports = router;
