const express = require('express');
const router = express.Router();
const passport = require('passport');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/auth');
const authController = require('../controllers/authController');

// Register endpoint
router.post('/register', registerLimiter, authController.register);

// Login endpoint
router.post('/login', loginLimiter, authController.login);

// Update profile endpoint
router.put('/update-profile', authMiddleware, authController.updateProfile);

// Get profile endpoint
router.get('/me', authMiddleware, authController.getProfile);

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        prompt: 'consent',
        accessType: 'offline'
    })
);

router.get('/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/login',
        failureMessage: true
    }),
    authController.handleGoogleCallback
);

module.exports = router;