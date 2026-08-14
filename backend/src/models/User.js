const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: false,
      select: false, // Never returned in queries by default
    },
    googleId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
    },
    authProviders: {
      type: [String],
      enum: ['local', 'google'],
      default: ['local'],
    },
    fullName: {
      type: String,
      trim: true,
      default: null,
    },
    avatarUrl: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailOtp: {
      code: String,
      expiresAt: Date,
    },
    passwordResetOtp: {
      code: String,
      expiresAt: Date,
    },
    role: {
      type: String,
      enum: ['USER', 'ADMIN'],
      default: 'USER',
    },
    refreshToken: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash') || !this.passwordHash || typeof this.passwordHash !== 'string') return;
  if (this.passwordHash.startsWith('$2a$') || this.passwordHash.startsWith('$2b$')) return;
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Method to compare entered password with stored hash
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!this.passwordHash || typeof this.passwordHash !== 'string' || typeof enteredPassword !== 'string') return false;
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
