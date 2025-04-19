const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { apiLimiter } = require('../middleware/rateLimiter');

/**
 * @route POST /api/payment/create
 * @desc Create a new payment for a transaction using Midtrans
 * @access Public
 */
router.post('/create', apiLimiter, paymentController.createPayment);

/**
 * @route GET /api/payment/status/:orderId
 * @desc Check payment status
 * @access Public
 */
router.get('/status/:orderId', paymentController.checkStatus);

/**
 * @route POST /api/payment/notification
 * @desc Handle notification from Midtrans
 * @access Public (for Midtrans callbacks)
 */
router.post('/notification', paymentController.handleNotification);

module.exports = router; 