// Plan-level constants
const PLAN_LIMITS = {
  FREE: {
    aiCredits: 0,
    allowedExportFormats: ['SVG'],
    maxImageResolution: '1K',
    maxVideoResolution: null,
    watermark: true,
    commercialUse: false,
  },
  BASE: {
    aiCredits: 300,
    allowedExportFormats: ['SVG', 'PDF', 'PNG'],
    maxImageResolution: '2K',
    maxVideoResolution: '720p',
    watermark: false,
    commercialUse: false,
  },
  PRO: {
    aiCredits: 10000,
    allowedExportFormats: ['SVG', 'PDF', 'DXF', 'PNG', 'MP4'],
    maxImageResolution: '8K',
    maxVideoResolution: '2K',
    watermark: false,
    commercialUse: true,
  },
};

// Plan prices in paise (₹1 = 100 paise)
const PLAN_PRICES = {
  BASE: {
    MONTHLY: 100000,   // ₹1,000
    YEARLY: 720000,    // ₹7,200 (40% off)
  },
  PRO: {
    MONTHLY: 1000000,  // ₹10,000
    YEARLY: 7200000,   // ₹72,000 (40% off)
  },
};

// AI feature credit costs
const AI_CREDIT_COSTS = {
  AI_DESIGN: 10,
  AI_CREATION: 20,
  AI_VIDEO: 50,
  AI_BACKGROUND: 5,
  AI_LOGO: 15,
};

module.exports = { PLAN_LIMITS, PLAN_PRICES, AI_CREDIT_COSTS };
