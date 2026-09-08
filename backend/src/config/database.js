const mongoose = require('mongoose');

const seedDefaultAdmin = async () => {
  try {
    const User = require('../models/User');
    const Subscription = require('../models/Subscription');
    const adminEmail = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@keylinedesign.com').toLowerCase().trim();

    const existingUser = await User.findOne({ email: adminEmail });
    if (!existingUser) {
      const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123456';
      const newAdmin = await User.create({
        email: adminEmail,
        passwordHash: adminPassword,
        fullName: 'System Administrator',
        isVerified: true,
        role: 'ADMIN',
      });
      await Subscription.create({ user: newAdmin._id, plan: 'ENTERPRISE', aiCredits: 99999 });
      console.log(`👑 Initial Default Admin Account seeded: ${adminEmail}`);
    }
  } catch (err) {
    console.error('❌ Error during admin seed:', err.message);
  }
};

const connectDB = async () => {
  try {
    const isProd = process.env.NODE_ENV === 'production';
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: process.env.MONGO_MAX_POOL_SIZE ? parseInt(process.env.MONGO_MAX_POOL_SIZE) : 50,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      autoIndex: !isProd, // Disable auto-indexing in production to save RAM and CPU
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host} [Pool Size: 50, autoIndex: ${!isProd}]`);

    // Seed default admin account once if missing
    await seedDefaultAdmin();

    // Drop legacy non-sparse razorpaySubId index if present
    try {
      await mongoose.connection.collection('subscriptions').dropIndex('razorpaySubId_1');
      console.log('🧹 Cleaned up legacy subscriptions index.');
    } catch {
      // Index already dropped or doesn't exist, ignore
    }
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;

