const PlanConfig = require('../../models/PlanConfig');
const Coupon = require('../../models/Coupon');
const { sendSuccess, sendError } = require('../../utils/response');

/* ─── GET PLAN CONFIG (PUBLIC) ───────────────────────────────────── */
const getPlanConfig = async (req, res, next) => {
  try {
    let config = await PlanConfig.findOne();
    if (!config) {
      config = await PlanConfig.create({});
    }

    const now = new Date();
    let isPromoValid = false;

    if (config.promotion && config.promotion.active) {
      const startsOk = !config.promotion.startsAt || new Date(config.promotion.startsAt) <= now;
      const endsOk = !config.promotion.endsAt || new Date(config.promotion.endsAt) >= now;
      isPromoValid = startsOk && endsOk;
    }

    return sendSuccess(
      res,
      {
        basePriceMonthly: config.basePriceMonthly,
        basePriceYearly: config.basePriceYearly,
        baseAiCredits: config.baseAiCredits,
        proPriceMonthly: config.proPriceMonthly,
        proPriceYearly: config.proPriceYearly,
        proAiCredits: config.proAiCredits,
        yearlyDiscountPercent: config.yearlyDiscountPercent,
        promotion: {
          active: isPromoValid,
          title: config.promotion?.title || 'Special Promotion',
          description: config.promotion?.description || '',
          discountPercent: config.promotion?.discountPercent || 0,
          startsAt: config.promotion?.startsAt,
          endsAt: config.promotion?.endsAt,
          isExpired: config.promotion?.endsAt ? new Date(config.promotion.endsAt) < now : false,
        },
      },
      'Plan configuration fetched successfully.'
    );
  } catch (err) {
    next(err);
  }
};

/* ─── UPDATE PLAN CONFIG (ADMIN) ─────────────────────────────────── */
const updatePlanConfig = async (req, res, next) => {
  try {
    let config = await PlanConfig.findOne();
    if (!config) {
      config = new PlanConfig({});
    }

    const {
      basePriceMonthly,
      basePriceYearly,
      baseAiCredits,
      proPriceMonthly,
      proPriceYearly,
      proAiCredits,
      yearlyDiscountPercent,
      promotion,
    } = req.body;

    if (typeof basePriceMonthly === 'number') config.basePriceMonthly = basePriceMonthly;
    if (typeof basePriceYearly === 'number') config.basePriceYearly = basePriceYearly;
    if (typeof baseAiCredits === 'number') config.baseAiCredits = baseAiCredits;
    if (typeof proPriceMonthly === 'number') config.proPriceMonthly = proPriceMonthly;
    if (typeof proPriceYearly === 'number') config.proPriceYearly = proPriceYearly;
    if (typeof proAiCredits === 'number') config.proAiCredits = proAiCredits;
    if (typeof yearlyDiscountPercent === 'number') config.yearlyDiscountPercent = yearlyDiscountPercent;

    if (promotion && typeof promotion === 'object') {
      config.promotion = {
        active: typeof promotion.active === 'boolean' ? promotion.active : config.promotion.active,
        title: promotion.title || config.promotion.title,
        description: promotion.description || config.promotion.description,
        discountPercent: typeof promotion.discountPercent === 'number' ? promotion.discountPercent : config.promotion.discountPercent,
        startsAt: promotion.startsAt ? new Date(promotion.startsAt) : null,
        endsAt: promotion.endsAt ? new Date(promotion.endsAt) : null,
      };
    }

    await config.save();
    return sendSuccess(res, config, 'Plan configuration updated successfully.');
  } catch (err) {
    next(err);
  }
};

/* ─── VALIDATE & APPLY COUPON (PUBLIC) ───────────────────────────── */
const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return sendError(res, 'Please provide a valid coupon code.', 400);
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return sendError(res, `Coupon code "${cleanCode}" is invalid.`, 404);
    }

    if (!coupon.active) {
      return sendError(res, `Coupon code "${cleanCode}" is no longer active.`, 400);
    }

    const now = new Date();
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      return sendError(res, `Coupon code "${cleanCode}" has expired.`, 400);
    }

    if (coupon.usedCount >= coupon.maxUses) {
      return sendError(res, `Coupon code "${cleanCode}" has reached its maximum usage limit.`, 400);
    }

    return sendSuccess(
      res,
      {
        code: coupon.code,
        discountPercent: coupon.discountPercent,
        flatDiscountINR: coupon.flatDiscountINR,
        expiresAt: coupon.expiresAt,
      },
      `Coupon "${coupon.code}" applied successfully!`
    );
  } catch (err) {
    next(err);
  }
};

/* ─── GET COUPONS LIST (ADMIN) ───────────────────────────────────── */
const getCouponsList = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return sendSuccess(res, coupons, 'Coupons fetched successfully.');
  } catch (err) {
    next(err);
  }
};

/* ─── CREATE COUPON (ADMIN) ──────────────────────────────────────── */
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountPercent, flatDiscountINR, maxUses, expiresAt, active } = req.body;
    if (!code) {
      return sendError(res, 'Coupon code is required.', 400);
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return sendError(res, `Coupon code "${cleanCode}" already exists.`, 400);
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      discountPercent: Number(discountPercent) || 0,
      flatDiscountINR: Number(flatDiscountINR) || 0,
      maxUses: Number(maxUses) || 1000,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      active: typeof active === 'boolean' ? active : true,
    });

    return sendSuccess(res, coupon, 'Coupon created successfully.', 201);
  } catch (err) {
    next(err);
  }
};

/* ─── UPDATE COUPON (ADMIN) ──────────────────────────────────────── */
const updateCoupon = async (req, res, next) => {
  try {
    const { couponId } = req.params;
    const { discountPercent, flatDiscountINR, maxUses, expiresAt, active } = req.body;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) return sendError(res, 'Coupon not found.', 404);

    if (typeof discountPercent === 'number') coupon.discountPercent = discountPercent;
    if (typeof flatDiscountINR === 'number') coupon.flatDiscountINR = flatDiscountINR;
    if (typeof maxUses === 'number') coupon.maxUses = maxUses;
    if (typeof active === 'boolean') coupon.active = active;
    if (expiresAt !== undefined) coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;

    await coupon.save();
    return sendSuccess(res, coupon, 'Coupon updated successfully.');
  } catch (err) {
    next(err);
  }
};

/* ─── DELETE COUPON (ADMIN) ──────────────────────────────────────── */
const deleteCoupon = async (req, res, next) => {
  try {
    const { couponId } = req.params;
    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) return sendError(res, 'Coupon not found.', 404);

    return sendSuccess(res, { id: couponId }, 'Coupon deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getPlanConfig,
  updatePlanConfig,
  applyCoupon,
  getCouponsList,
  createCoupon,
  updateCoupon,
  deleteCoupon,
};
