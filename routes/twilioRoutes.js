const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const twilioController = require('../controllers/twilioController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * /api/twilio/send-sms:
 *   post:
 *     tags: [Notifications]
 *     summary: Send SMS via Twilio
 *     description: Send an SMS message using Twilio API
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - body
 *             properties:
 *               to:
 *                 type: string
 *                 example: "+62812345678"
 *               body:
 *                 type: string
 *                 example: "Your message here"
 *     responses:
 *       200:
 *         description: SMS sent successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/send-sms', 
  auth,
  [
    check('to').notEmpty().withMessage('Phone number is required').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
    check('body').notEmpty().withMessage('Message body is required').isLength({ max: 1600 }).withMessage('Message too long')
  ],
  twilioController.sendSMS
);

/**
 * @swagger
 * /api/twilio/make-call:
 *   post:
 *     tags: [Notifications]
 *     summary: Make voice call via Twilio
 *     description: Initiate a voice call using Twilio API
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - twiml
 *             properties:
 *               to:
 *                 type: string
 *                 example: "+62812345678"
 *               twiml:
 *                 type: string
 *                 example: "<Response><Say>Hello, this is a test call from Manakeu.</Say></Response>"
 *     responses:
 *       200:
 *         description: Call initiated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/make-call', 
  auth,
  [
    check('to').notEmpty().withMessage('Phone number is required').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
    check('twiml').notEmpty().withMessage('TwiML is required')
  ],
  twilioController.makeCall
);

/**
 * @swagger
 * /api/twilio/logs:
 *   get:
 *     tags: [Notifications]
 *     summary: Get Twilio message logs
 *     description: Retrieve recent message logs from Twilio
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Message logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/logs', 
  auth,
  twilioController.getMessageLogs
);

module.exports = router; 