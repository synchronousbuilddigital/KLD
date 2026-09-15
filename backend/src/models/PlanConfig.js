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
    baseTitle: {
      type: String,
      default: 'Base Plan',
    },
    baseDescription: {
      type: String,
      default: 'Essential tools for beginners.',
    },
    baseFeatures: {
      type: [
        {
          text: String,
          included: Boolean,
          info: Boolean,
        }
      ],
      default: [
        { text: "Remove all watermarks", included: true },
        { text: "Export dieline templates: not supported", included: false },
        { text: "Maximum export of 2K rendered images", included: true },
        { text: "Maximum export of 720p rendered videos", included: true },
        { text: "Maximum export of 2K AI background images", included: true },
        { text: "For personal use only", included: true, info: true },
      ],
    },
    baseAiFeatures: {
      type: [
        {
          text: String,
          included: Boolean,
        }
      ],
      default: [
        { text: "300 AI credits, updated monthly", included: true },
        { text: "Access to AI Design, AI Creation, AI Video, AI Background and AI Logo features.", included: true },
      ],
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
    proTitle: {
      type: String,
      default: 'Pro Plan',
    },
    proDescription: {
      type: String,
      default: 'Advanced features for serious creators and professionals.',
    },
    proFeatures: {
      type: [
        {
          text: String,
          included: Boolean,
          info: Boolean,
        }
      ],
      default: [
        { text: "Maximum export of 8K rendered images", included: true },
        { text: "Maximum export of 2K rendered videos", included: true },
        { text: "Advanced features of the dieline templates", included: true },
        { text: "Commercial use and resale license", included: true, info: true },
      ],
    },
    proAiFeatures: {
      type: [
        {
          text: String,
          included: Boolean,
        }
      ],
      default: [
        { text: "10,000 AI credits, updated monthly", included: true },
        { text: "Access to AI Design, AI Creation, AI Video, AI Background and AI Logo features.", included: true },
      ],
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
