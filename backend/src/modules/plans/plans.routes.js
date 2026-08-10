const express = require('express');
const router = express.Router();
const plansController = require('./plans.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');

/* ─── PUBLIC ROUTES ──────────────────────────────────────────────── */
router.get('/', plansController.getPlanConfig);
router.post('/apply-coupon', plansController.applyCoupon);

/* ─── PROTECTED ADMIN ROUTES ─────────────────────────────────────── */
router.patch('/admin', authenticate, authorize('ADMIN'), plansController.updatePlanConfig);

router.get('/admin/coupons', authenticate, authorize('ADMIN'), plansController.getCouponsList);
router.post('/admin/coupons', authenticate, authorize('ADMIN'), plansController.createCoupon);
router.patch('/admin/coupons/:couponId', authenticate, authorize('ADMIN'), plansController.updateCoupon);
router.delete('/admin/coupons/:couponId', authenticate, authorize('ADMIN'), plansController.deleteCoupon);

module.exports = router;
