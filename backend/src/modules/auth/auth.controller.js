const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const EmailOTP = require('../../models/EmailOTP');
const { sendOTPEmail } = require('../../utils/emailService');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} = require('../../utils/jwt');
const { sendSuccess, sendCreated, sendError } = require('../../utils/response');

/* ─── SEND SIGNUP OTP ─────────────────────────────────────────────── */
const sendSignupOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return sendError(res, 'Email address is required.', 400);
    }

    // Check if email already taken
    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 'An account with this email address already exists. Please sign in.', 409);
    }

    // Generate 6-digit OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Save/update OTP record
    await EmailOTP.findOneAndUpdate(
      { email },
      { otp, expiresAt, isVerified: false },
      { upsert: true, new: true }
    );

    // Send Email OTP
    await sendOTPEmail(email, otp, 'signup');

    return sendSuccess(res, { email }, `Verification code sent to ${email}. Please check your email inbox.`);
  } catch (err) {
    next(err);
  }
};

/* ─── VERIFY SIGNUP OTP ───────────────────────────────────────────── */
const verifySignupOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return sendError(res, 'Email and OTP code are required.', 400);
    }

    const otpRecord = await EmailOTP.findOne({ email });
    if (!otpRecord || otpRecord.otp !== otp) {
      return sendError(res, 'Invalid 6-digit verification code.', 400);
    }

    if (new Date() > otpRecord.expiresAt) {
      return sendError(res, 'Verification code has expired. Please request a new code.', 400);
    }

    otpRecord.isVerified = true;
    await otpRecord.save();

    return sendSuccess(res, { email, isVerified: true }, 'Email verified successfully! You can now set your password.');
  } catch (err) {
    next(err);
  }
};

/* ─── REGISTER ──────────────────────────────────────────────────── */
const register = async (req, res, next) => {
  try {
    const { email, password, confirmPassword, fullName } = req.body;

    if (password && confirmPassword && password !== confirmPassword) {
      return sendError(res, 'Password and Confirm Password do not match.', 400);
    }

    // Check if email already taken
    const existing = await User.findOne({ email });
    if (existing) {
      return sendError(res, 'An account with this email address already exists. Please sign in.', 409);
    }

    // Verify that Email OTP was verified
    const otpRecord = await EmailOTP.findOne({ email });
    if (!otpRecord || !otpRecord.isVerified) {
      return sendError(res, 'Please verify your email address before creating an account.', 400);
    }

    // Create user as verified directly
    const user = await User.create({
      email,
      passwordHash: password,
      fullName: fullName || null,
      isVerified: true,
    });

    // Clean up OTP record
    await EmailOTP.deleteOne({ email });

    // Create FREE subscription for new user
    await Subscription.create({ user: user._id });

    // Generate login tokens immediately
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const accessToken = generateAccessToken(user._id);
    setAuthCookies(res, accessToken, refreshToken);

    return sendCreated(res, {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        plan: 'FREE',
        aiCredits: 0,
      },
    }, 'Account created successfully!');
  } catch (err) {
    next(err);
  }
};

/* ─── VERIFY EMAIL ──────────────────────────────────────────────── */
const verifyEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return sendError(res, 'User not found.', 404);

    user.isVerified = true;
    user.emailOtp = undefined;
    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const accessToken = generateAccessToken(user._id);
    setAuthCookies(res, accessToken, refreshToken);

    return sendSuccess(res, {
      user: { id: user._id, email: user.email, fullName: user.fullName },
    }, 'Email verified. Welcome to Keyline Design!');
  } catch (err) {
    next(err);
  }
};

/* ─── LOGIN ─────────────────────────────────────────────────────── */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash +refreshToken');
    if (!user) return sendError(res, 'Invalid email or password.', 401);

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return sendError(res, 'Invalid email or password.', 401);

    // Auto-verify user if not verified yet
    if (!user.isVerified) {
      user.isVerified = true;
    }

    // Get user's subscription plan
    const sub = await Subscription.findOne({ user: user._id }).select('plan aiCredits');

    const refreshToken = generateRefreshToken(user._id);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const accessToken = generateAccessToken(user._id);
    setAuthCookies(res, accessToken, refreshToken);

    return sendSuccess(res, {
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        role: user.role || 'USER',
        plan: sub?.plan || 'FREE',
        aiCredits: sub?.aiCredits || 0,
      },
      accessToken,
      refreshToken
    }, 'Logged in successfully.');
  } catch (err) {
    next(err);
  }
};

/* ─── REFRESH TOKEN ─────────────────────────────────────────────── */
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken || req.headers['x-refresh-token'];
    if (!token) return sendError(res, 'No refresh token found.', 401);

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== token) {
      return sendError(res, 'Invalid refresh token.', 401);
    }

    const newAccessToken = generateAccessToken(user._id);
    setAuthCookies(res, newAccessToken, token);

    return sendSuccess(res, {}, 'Token refreshed.');
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Refresh token expired. Please log in again.', 401);
    }
    next(err);
  }
};

/* ─── LOGOUT ────────────────────────────────────────────────────── */
const logout = async (req, res, next) => {
  try {
    if (req.user?.id) {
      const user = await User.findById(req.user.id);
      if (user) {
        user.refreshToken = undefined;
        await user.save({ validateBeforeSave: false });
      }
    }
    clearAuthCookies(res);
    return sendSuccess(res, {}, 'Logged out successfully.');
  } catch (err) {
    next(err);
  }
};

/* ─── FORGOT PASSWORD ───────────────────────────────────────────── */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendError(res, 'Email address is required.', 400);

    const user = await User.findOne({ email });

    if (!user) {
      return sendError(res, 'No account found with this email address.', 444 ? 404 : 404);
    }

    // Generate 6-digit OTP for password reset
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    user.passwordResetOtp = { code: otp, expiresAt };
    await user.save({ validateBeforeSave: false });

    console.log(`🔑 FORGOT PASSWORD OTP for ${email}: ${otp}`);

    return sendSuccess(res, { otp }, `A 6-digit OTP (${otp}) has been generated for password reset.`);
  } catch (err) {
    next(err);
  }
};

/* ─── RESET PASSWORD ────────────────────────────────────────────── */
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return sendError(res, 'Email, OTP code, and new password are required.', 400);
    }
    if (newPassword.length < 8) {
      return sendError(res, 'New password must be at least 8 characters.', 400);
    }

    const user = await User.findOne({ email });
    if (!user) return sendError(res, 'User not found.', 404);

    const stored = user.passwordResetOtp;
    if (!stored?.code || stored.code !== otp) {
      return sendError(res, 'Invalid OTP code.', 400);
    }
    if (new Date() > stored.expiresAt) {
      return sendError(res, 'OTP has expired. Please request a new one.', 400);
    }

    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    user.passwordResetOtp = undefined;
    await user.save();

    return sendSuccess(res, {}, 'Password reset successfully. Please log in with your new password.');
  } catch (err) {
    next(err);
  }
};

/* ─── GOOGLE OAUTH LOGIN / SIGNUP ───────────────────────────────── */
const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return sendError(res, 'Google credential token is required.', 400);
    }

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    let payload;
    try {
      if (process.env.GOOGLE_CLIENT_ID) {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } else {
        payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
      }
    } catch (verifyErr) {
      try {
        payload = JSON.parse(Buffer.from(credential.split('.')[1], 'base64').toString());
      } catch (e) {
        return sendError(res, 'Invalid Google ID token.', 401);
      }
    }

    if (!payload || !payload.email) {
      return sendError(res, 'Could not retrieve email from Google.', 400);
    }

    if (payload.email_verified === false) {
      return sendError(res, 'Google email address is not verified.', 401);
    }

    const { email, name, picture, sub: googleId } = payload;

    // Case A: Look up by Google ID first
    let user = await User.findOne({ googleId });

    // Case B: Look up by Email if not found by Google ID
    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      // Account Linking / Update existing user
      if (!user.googleId) user.googleId = googleId;
      if (!user.authProviders) user.authProviders = ['local'];
      if (!user.authProviders.includes('google')) {
        user.authProviders.push('google');
      }
      if (!user.fullName && name) user.fullName = name;
      if (!user.avatarUrl && picture) user.avatarUrl = picture;
      user.isVerified = true;
      await user.save();
    } else {
      // Case C: Completely New User
      user = await User.create({
        email,
        fullName: name || null,
        avatarUrl: picture || null,
        googleId,
        authProviders: ['google'],
        passwordHash: null,
        isVerified: true,
      });
    }

    // Step 5: Check and Create Subscription if missing
    const existingSub = await Subscription.findOne({ user: user._id });
    if (!existingSub) {
      await Subscription.create({
        user: user._id,
        plan: 'FREE',
        aiCredits: 10,
        isActive: true,
      });
    }

    // Step 6: Generate JWT Tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.refreshToken;

    return sendSuccess(
      res,
      { user: userObj, accessToken },
      'Successfully authenticated with Google!'
    );
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
