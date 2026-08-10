const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const {
  getDashboardStats,
  getUsersList,
  updateUser,
  getAllProjects,
  deleteProject
} = require('./admin.controller');

// Apply authentication + admin authorization to all routes in this router
router.use(authenticate, authorize('ADMIN'));


router.get('/stats', getDashboardStats);
router.get('/users', getUsersList);
router.patch('/users/:userId', updateUser);
router.get('/projects', getAllProjects);
router.delete('/projects/:projectId', deleteProject);

module.exports = router;
