const mongoose = require('mongoose');

const planConfigSchema = new mongoose.Schema(
  {
    basePriceMonthly: {
      type: Number,
      default: 1000,
    },
    basePriceYearly: {
      type: Number,
      default: 600,
    },
    baseAiCredits: {
      type: Number,
      default: 300,
    },
    proPriceMonthly: {
      type: Number,
      default: 10000,
    },
    proPriceYearly: {
      type: Number,
      default: 6000,
    },
    proAiCredits: {
      type: Number,
      default: 10000,
    },
    yearlyDiscountPercent: {
      type: Number,
      default: 40,
    },
    promotion: {
      active: {
        type: Boolean,
        default: false,
      },
      title: {
        type: String,
        default: 'Festival Sale',
      },
      description: {
        type: String,
        default: 'Limited-time special discount on all membership tiers!',
      },
      discountPercent: {
        type: Number,
        default: 30,
      },
      startsAt: {
        type: Date,
        default: null,
      },
      endsAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

const PlanConfig = mongoose.model('PlanConfig', planConfigSchema);
module.exports = PlanConfig;
