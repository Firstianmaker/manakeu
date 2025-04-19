// routes/redisRoutes.js
const express = require('express');
const router = express.Router();
// const authMiddleware = require('../middleware/auth');
// const { isAdmin } = require('../middleware/roleMiddleware');

const { 
    getUserSession,
    getProjectSummary,
    getUserActivities,
    getApprovalStats,
    getTransactionTimeline,
    getNotificationCounter,
    getMonthlyReport,
    getUserDashboard,
    getProjectMembers,
    getSearchResults

} = require('../controllers/redisController');

// router.use(authMiddleware);
// User
router.get('/session/:userId', getUserSession);
router.get('/user/activities/:userId', getUserActivities);
router.get('/user/notifications/:userId', getNotificationCounter);
router.get('/user/dashboard/:userId', getUserDashboard);

// Project
router.get('/project/summary/:projectId', getProjectSummary);
router.get('/project/timeline/:projectId', getTransactionTimeline);
router.get('/project/monthly/:projectId', getMonthlyReport);
router.get('/project/members/:projectId', getProjectMembers);

router.get('/admin/approval-stats/:adminId', getApprovalStats);
router.get('/search', getSearchResults);

module.exports = router;