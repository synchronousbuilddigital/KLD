const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const User = require('../../models/User');
const Subscription = require('../../models/Subscription');
const { sendSuccess, sendError } = require('../../utils/response');

// GET /api/users/me — Get current user profile + subscription
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return sendError(res, 'User not found.', 404);

    const sub = await Subscription.findOne({ user: req.user.id });

    return sendSuccess(res, {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      role: user.role || 'USER',
      isVerified: user.isVerified,
      subscription: sub
        ? {
            plan: sub.plan,
            billingCycle: sub.billingCycle,
            aiCredits: sub.aiCredits,
            aiCreditsReset: sub.aiCreditsReset,
            isActive: sub.isActive,
            endDate: sub.endDate,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/me — Update profile
router.patch('/me', authenticate, async (req, res, next) => {
  try {
    const { fullName } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName },
      { new: true, runValidators: true }
    );
    return sendSuccess(res, {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
    }, 'Profile updated.');
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/me/password — Change password
router.patch('/me/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 'Both currentPassword and newPassword are required.', 400);
    }
    if (newPassword.length < 8) {
      return sendError(res, 'New password must be at least 8 characters.', 400);
    }

    const user = await User.findById(req.user.id).select('+passwordHash');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return sendError(res, 'Current password is incorrect.', 401);

    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();

    return sendSuccess(res, {}, 'Password changed successfully.');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
