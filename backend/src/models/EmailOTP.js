const mongoose = require('mongoose');

const emailOTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    attempts: {
      type: Number,
      default: 0, // Tracks failed verification attempts — invalidated after 5
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-expire documents after 10 minutes
emailOTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOTP = mongoose.model('EmailOTP', emailOTPSchema);
module.exports = EmailOTP;
