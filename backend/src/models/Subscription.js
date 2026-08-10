const mongoose = require('mongoose');
const { PLAN_LIMITS } = require('../config/constants');

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    plan: {
      type: String,
      enum: ['FREE', 'BASE', 'PRO'],
      default: 'FREE',
    },
    billingCycle: {
      type: String,
      enum: ['MONTHLY', 'YEARLY'],
      default: 'MONTHLY',
    },
    aiCredits: {
      type: Number,
      default: 0,
    },
    aiCreditsReset: {
      type: Date,
      default: () => {
        const next = new Date();
        next.setMonth(next.getMonth() + 1);
        next.setDate(1);
        next.setHours(0, 0, 0, 0);
        return next;
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    razorpaySubId: {
      type: String,
      sparse: true,
    },
  },
  { timestamps: true }
);

// Helper: get plan credit allowance
subscriptionSchema.methods.getMonthlyCredits = function () {
  return PLAN_LIMITS[this.plan]?.aiCredits ?? 0;
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
