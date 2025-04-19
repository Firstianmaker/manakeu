// routes/complexTransactionRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleMiddleware');

const { getProjectMonthly, projectBudgetAdjustment } = require('../controllers/financeController');
const { getApprovalStats, bulkNotaApproval } = require('../controllers/approvalController');
const { getProjectTimeline, transferProject } = require('../controllers/projectController');
const { getNotaAnalysis, getNotaUser, notaRevisionRequest } = require('../controllers/notaController');
const { getTransactionHistory, getRecentHistory } = require('../controllers/historyController');
const { createBatchTransactions, projectTransactionAnalysis } = require('../controllers/transaksiController');
const { projectSummaryReport, userActivityReport } = require('../controllers/reportController');

/**
 * @swagger
 * tags:
 *   name: Complex Transactions
 *   description: Complex transaction management and analysis endpoints
 */

// Middleware untuk semua routes
router.use(authMiddleware);

/**
 * @swagger
 * /api/complex/project-monthly:
 *   get:
 *     summary: Get monthly project financial data
 *     tags: [Complex Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly project financial data retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/project-monthly', getProjectMonthly);

/**
 * @swagger
 * /api/complex/admin-approval-stats:
 *   get:
 *     summary: Get approval statistics for admin
 *     tags: [Complex Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Approval statistics retrieved successfully
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Server error
 */
router.get('/admin-approval-stats', isAdmin, getApprovalStats);

/**
 * @swagger
 * /api/complex/project-timeline/{projectId}:
 *   get:
 *     summary: Get project timeline
 *     tags: [Complex Transactions]
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
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/project-timeline/:projectId', getProjectTimeline);

/**
 * @swagger
 * /api/complex/nota-verification-analysis:
 *   get:
 *     summary: Get nota verification analysis for admin
 *     tags: [Complex Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nota verification analysis retrieved successfully
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Server error
 */
router.get('/nota-verification-analysis', isAdmin, getNotaAnalysis);

/**
 * @swagger
 * /api/complex/user-transaction-history/{userId}:
 *   get:
 *     summary: Get user's transaction history
 *     tags: [Complex Transactions]
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
 *         description: Transaction history retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/user-transaction-history/:userId', getTransactionHistory);

/**
 * @swagger
 * /api/complex/user-last-activities/{userId}:
 *   get:
 *     summary: Get user's recent activities
 *     tags: [Complex Transactions]
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
 *         description: Recent activities retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/user-last-activities/:userId', getRecentHistory);

/**
 * @swagger
 * /api/complex/user-nota-status/{userId}:
 *   get:
 *     summary: Get user's nota status
 *     tags: [Complex Transactions]
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
 *         description: Nota status retrieved successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/user-nota-status/:userId', getNotaUser);

/**
 * @swagger
 * /api/complex/batch-transaction:
 *   post:
 *     summary: Create multiple transactions in batch
 *     tags: [Complex Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactions
 *             properties:
 *               transactions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - ID_Project
 *                     - Jenis_Transaksi
 *                     - Jumlah
 *                   properties:
 *                     ID_Project:
 *                       type: integer
 *                     Jenis_Transaksi:
 *                       type: string
 *                     Jumlah:
 *                       type: number
 *     responses:
 *       200:
 *         description: Batch transactions created successfully
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/batch-transaction', createBatchTransactions);

/**
 * @swagger
 * /api/complex/bulk-nota-approval:
 *   put:
 *     summary: Approve multiple notas in bulk
 *     tags: [Complex Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notaIds
 *               - status
 *             properties:
 *               notaIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *                 enum: [Approved, Rejected]
 *     responses:
 *       200:
 *         description: Bulk nota approval completed successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Access denied - Admin only
 *       500:
 *         description: Server error
 */
router.put('/bulk-nota-approval', isAdmin, bulkNotaApproval);

/**
 * @swagger
 * /api/complex/project-budget-adjustment:
 *   put:
 *     summary: Adjust project budget
 *     tags: [Complex Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_Project
 *               - adjustment_amount
 *             properties:
 *               ID_Project:
 *                 type: integer
 *               adjustment_amount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Project budget adjusted successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/project-budget-adjustment', projectBudgetAdjustment);

/**
 * @swagger
 * /api/complex/nota-revision-request:
 *   put:
 *     summary: Request revision for a nota
 *     tags: [Complex Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_Nota
 *               - revision_notes
 *             properties:
 *               ID_Nota:
 *                 type: integer
 *               revision_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Revision request sent successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Nota not found
 *       500:
 *         description: Server error
 */
router.put('/nota-revision-request', notaRevisionRequest);

/**
 * @swagger
 * /api/complex/transfer-project:
 *   post:
 *     summary: Transfer project to another user
 *     tags: [Complex Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_Project
 *               - new_owner_id
 *             properties:
 *               ID_Project:
 *                 type: integer
 *               new_owner_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Project transferred successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project or user not found
 *       500:
 *         description: Server error
 */
router.post('/transfer-project', transferProject);

/**
 * @swagger
 * /api/complex/project-summary-report:
 *   post:
 *     summary: Generate project summary report
 *     tags: [Complex Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_Project
 *               - start_date
 *               - end_date
 *             properties:
 *               ID_Project:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Project summary report generated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post('/project-summary-report', projectSummaryReport);

/**
 * @swagger
 * /api/complex/project-transaction-analysis:
 *   post:
 *     summary: Analyze project transactions
 *     tags: [Complex Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_Project
 *               - analysis_type
 *             properties:
 *               ID_Project:
 *                 type: integer
 *               analysis_type:
 *                 type: string
 *                 enum: [monthly, category, trend]
 *     responses:
 *       200:
 *         description: Transaction analysis completed successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post('/project-transaction-analysis', projectTransactionAnalysis);

/**
 * @swagger
 * /api/complex/user-activity-report:
 *   post:
 *     summary: Generate user activity report
 *     tags: [Complex Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ID_User
 *               - start_date
 *               - end_date
 *             properties:
 *               ID_User:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: User activity report generated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/user-activity-report', userActivityReport);


// Middleware untuk semua routes
router.use(authMiddleware);
router.get('/project-monthly', getProjectMonthly);
router.get('/admin-approval-stats', isAdmin, getApprovalStats);
router.get('/project-timeline/:projectId', getProjectTimeline);
router.get('/nota-verification-analysis', isAdmin, getNotaAnalysis);
router.get('/user-transaction-history/:userId', getTransactionHistory);
router.get('/user-last-activities/:userId', getRecentHistory);
router.get('/user-nota-status/:userId', getNotaUser);
router.post('/batch-transaction', createBatchTransactions);
router.put('/bulk-nota-approval', isAdmin, bulkNotaApproval);
router.put('/project-budget-adjustment', projectBudgetAdjustment);
router.put('/nota-revision-request', notaRevisionRequest);
router.post('/transfer-project', transferProject);
router.post('/project-summary-report', projectSummaryReport);
router.post('/project-transaction-analysis', projectTransactionAnalysis);
router.post('/user-activity-report', userActivityReport);



module.exports = router;