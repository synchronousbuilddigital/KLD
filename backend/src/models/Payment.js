const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    razorpayOrderId: {
      type: String,
      unique: true,
      sparse: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number,
      required: true, // In paise (₹1 = 100 paise)
    },
    currency: {
      type: String,
      default: 'INR',
    },
    plan: {
      type: String,
      enum: ['BASE', 'PRO'],
      required: true,
    },
    billingCycle: {
      type: String,
      enum: ['MONTHLY', 'YEARLY'],
      required: true,
    },
    status: {
      type: String,
      enum: ['CREATED', 'PAID', 'FAILED', 'REFUNDED'],
      default: 'CREATED',
    },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
