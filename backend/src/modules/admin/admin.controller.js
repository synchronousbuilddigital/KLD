const User = require('../../models/User');
const SavedDesign = require('../../models/SavedDesign');
const Subscription = require('../../models/Subscription');
const { sendSuccess, sendError } = require('../../utils/response');

/* ─── GET DASHBOARD STATS ─────────────────────────────────────────── */
const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalProjects = await SavedDesign.countDocuments();
    
    const PlanConfig = require('../../models/PlanConfig');
    let planConfig = await PlanConfig.findOne();
    const BASE_PRICE = planConfig ? planConfig.basePriceMonthly : 1000;
    const PRO_PRICE = planConfig ? planConfig.proPriceMonthly : 10000;

    // Subscriptions breakdown
    const freePlanCount = await Subscription.countDocuments({ plan: 'FREE' });
    const basePlanCount = await Subscription.countDocuments({ plan: 'BASE' });
    const proPlanCount = await Subscription.countDocuments({ plan: 'PRO' });

    const mrrINR = (basePlanCount * BASE_PRICE) + (proPlanCount * PRO_PRICE);
    const arrINR = mrrINR * 12;

    // Recent 5 users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('email fullName role isVerified createdAt');

    // Category breakdown for saved projects
    const categoryStats = await SavedDesign.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    return sendSuccess(res, {
      totalUsers,
      totalProjects,
      plans: {
        FREE: freePlanCount,
        BASE: basePlanCount,
        PRO: proPlanCount
      },
      revenue: {
        mrrINR,
        arrINR,
        basePrice: BASE_PRICE,
        proPrice: PRO_PRICE
      },
      recentUsers,
      categoryStats
    }, 'Admin dashboard stats fetched successfully.');
  } catch (err) {
    next(err);
  }
};

/* ─── GET USERS LIST ─────────────────────────────────────────────── */
const getUsersList = async (req, res, next) => {
  try {
    const { search = '', role = '', plan = '', page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { fullName: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const skip = (Number(page) - 1) * Number(limit);
    const totalUsers = await User.countDocuments(query);

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select('email fullName role isVerified createdAt');

    // Attach subscriptions and saved project count
    const userIds = users.map(u => u._id);
    const subscriptions = await Subscription.find({ user: { $in: userIds } });
    const subMap = {};
    subscriptions.forEach(s => { subMap[s.user.toString()] = s; });

    const projectCounts = await SavedDesign.aggregate([
      { $match: { user: { $in: userIds } } },
      { $group: { _id: '$user', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    projectCounts.forEach(pc => { countMap[pc._id.toString()] = pc.count; });

    const result = users.map(u => ({
      id: u._id.toString(),
      _id: u._id.toString(),
      email: u.email,
      fullName: u.fullName,
      role: u.role || 'USER',
      isVerified: u.isVerified,
      createdAt: u.createdAt,
      savedProjectsCount: countMap[u._id.toString()] || 0,
      subscription: subMap[u._id.toString()] || { plan: 'FREE', aiCredits: 0 }
    }));

    return sendSuccess(res, {
      users: result,
      pagination: {
        total: totalUsers,
        page: Number(page),
        pages: Math.ceil(totalUsers / Number(limit))
      }
    }, 'Users list fetched.');
  } catch (err) {
    next(err);
  }
};

/* ─── UPDATE USER (ROLE, PLAN, CREDITS) ──────────────────────────── */
const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role, plan, aiCredits, isVerified } = req.body;

    const user = await User.findById(userId);
    if (!user) return sendError(res, 'User not found.', 404);

    if (role && role !== user.role) {
      if (role === 'ADMIN') {
        return sendError(res, 'Role elevation is disabled. Platform supports a single primary Admin account.', 400);
      }
      if (['USER', 'ADMIN'].includes(role)) {
        user.role = role;
      }
    }
    if (typeof isVerified === 'boolean') {
      user.isVerified = isVerified;
    }
    await user.save();

    // Update Subscription if plan or credits passed
    let sub = await Subscription.findOne({ user: userId });
    if (!sub && (plan || typeof aiCredits === 'number')) {
      sub = await Subscription.create({ user: userId });
    }

    if (sub) {
      if (plan && ['FREE', 'BASE', 'PRO', 'ENTERPRISE'].includes(plan)) {
        sub.plan = plan;
      }
      if (typeof aiCredits === 'number') {
        sub.aiCredits = Math.max(0, aiCredits);
      }
      await sub.save();
    }

    return sendSuccess(res, {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isVerified: user.isVerified,
      subscription: sub ? { plan: sub.plan, aiCredits: sub.aiCredits } : null
    }, 'User updated successfully by Admin.');
  } catch (err) {
    next(err);
  }
};

/* ─── GET ALL SAVED PROJECTS ─────────────────────────────────────── */
const getAllProjects = async (req, res, next) => {
  try {
    const { search = '', page = 1, limit = 20 } = req.query;
    
    const query = {};
    if (search) {
      const matchingUsers = await User.find({
        $or: [
          { email: { $regex: search, $options: 'i' } },
          { fullName: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const matchingUserIds = matchingUsers.map(u => u._id);

      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { user: { $in: matchingUserIds } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const totalProjects = await SavedDesign.countDocuments(query);

    const projects = await SavedDesign.find(query)
      .populate('user', 'email fullName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return sendSuccess(res, {
      projects,
      pagination: {
        total: totalProjects,
        page: Number(page),
        pages: Math.ceil(totalProjects / Number(limit))
      }
    }, 'All saved projects fetched.');
  } catch (err) {
    next(err);
  }
};

/* ─── DELETE SAVED PROJECT ───────────────────────────────────────── */
const deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const deleted = await SavedDesign.findByIdAndDelete(projectId);
    if (!deleted) return sendError(res, 'Project not found.', 404);
    return sendSuccess(res, {}, 'Project deleted successfully.');
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getUsersList,
  updateUser,
  getAllProjects,
  deleteProject
};
