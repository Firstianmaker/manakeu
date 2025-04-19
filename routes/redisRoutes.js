// routes/redisRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleMiddleware');

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

/**
 * @swagger
 * tags:
 *   name: Cache
 *   description: Redis cache management endpoints
 */

router.use(authMiddleware);

/**
 * @swagger
 * /api/cache/session/{userId}:
 *   get:
 *     summary: Get user session from cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User session retrieved successfully
 *       404:
 *         description: Session not found in cache
 *       500:
 *         description: Redis server error
 */
router.get('/session/:userId', getUserSession);

/**
 * @swagger
 * /api/cache/project/summary/{projectId}:
 *   get:
 *     summary: Get project summary from cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project summary retrieved successfully
 *       404:
 *         description: Project summary not found in cache
 *       500:
 *         description: Redis server error
 */
router.get('/project/summary/:projectId', getProjectSummary);

/**
 * @swagger
 * /api/cache/user/activities/{userId}:
 *   get:
 *     summary: Get user activities from cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User activities retrieved successfully
 *       404:
 *         description: Activities not found in cache
 *       500:
 *         description: Redis server error
 */
router.get('/user/activities/:userId', getUserActivities);

/**
 * @swagger
 * /api/cache/admin/approval-stats/{adminId}:
 *   get:
 *     summary: Get admin approval statistics from cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Admin ID
 *     responses:
 *       200:
 *         description: Approval statistics retrieved successfully
 *       404:
 *         description: Statistics not found in cache
 *       500:
 *         description: Redis server error
 */
router.get('/admin/approval-stats/:adminId', getApprovalStats);

/**
 * @swagger
 * /api/cache/project/timeline/{projectId}:
 *   get:
 *     summary: Get project timeline from cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project timeline retrieved successfully
 *       404:
 *         description: Timeline not found in cache
 *       500:
 *         description: Redis server error
 */
router.get('/project/timeline/:projectId', getTransactionTimeline);

/**
 * @swagger
 * /api/cache/user/notifications/{userId}:
 *   get:
 *     summary: Get user notification counter from cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Notification counter retrieved successfully
 *       404:
 *         description: Counter not found in cache
 *       500:
 *         description: Redis server error
 */
router.get('/user/notifications/:userId', getNotificationCounter);

/**
 * @swagger
 * /api/cache/project/monthly/{projectId}:
 *   get:
 *     summary: Get project monthly report from cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Monthly report retrieved successfully
 *       404:
 *         description: Report not found in cache
 *       500:
 *         description: Redis server error
 */
router.get('/project/monthly/:projectId', getMonthlyReport);

/**
 * @swagger
 * /api/cache/user/dashboard/{userId}:
 *   get:
 *     summary: Get user dashboard data from cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: Dashboard data retrieved successfully
 *       404:
 *         description: Dashboard data not found in cache
 *       500:
 *         description: Redis server error
 */
router.get('/user/dashboard/:userId', getUserDashboard);

/**
 * @swagger
 * /api/cache/project/members/{projectId}:
 *   get:
 *     summary: Get project members from cache
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: projectId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project members retrieved successfully
 *       404:
 *         description: Members not found in cache
 *       500:
 *         description: Redis server error
 */
router.get('/project/members/:projectId', getProjectMembers);

/**
 * @swagger
 * /api/cache/search:
 *   get:
 *     summary: Get cached search results
 *     tags: [Cache]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       404:
 *         description: No cached results found
 *       500:
 *         description: Redis server error
 */


router.use(authMiddleware);

router.get('/session/:userId', getUserSession);
router.get('/project/summary/:projectId', getProjectSummary);
router.get('/user/activities/:userId', getUserActivities);
router.get('/admin/approval-stats/:adminId', getApprovalStats);
router.get('/project/timeline/:projectId', getTransactionTimeline);
router.get('/user/notifications/:userId', getNotificationCounter);
router.get('/project/monthly/:projectId', getMonthlyReport);
router.get('/user/dashboard/:userId', getUserDashboard);
router.get('/project/members/:projectId', getProjectMembers);
router.get('/search', getSearchResults);

module.exports = router;