const rateLimit = require('express-rate-limit');

// Limiter untuk API secara umum
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 100, // maksimal 100 request per IP
    message: {
        error: 'Terlalu banyak request dari IP ini, silakan coba lagi setelah 15 menit'
    },
    standardHeaders: true, // Return rate limit info dalam headers
    legacyHeaders: false,
});

// Limiter khusus untuk login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 5, // maksimal 5 percobaan login
    message: {
        error: 'Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiter khusus untuk register
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 jam
    max: 3, // maksimal 3 registrasi per jam
    message: {
        error: 'Terlalu banyak percobaan registrasi, silakan coba lagi setelah 1 jam'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Limiter untuk endpoint sensitif (seperti reset password, verifikasi email, dll)
const sensitiveRouteLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 jam
    max: 3, // maksimal 3 request per jam
    message: {
        error: 'Terlalu banyak request untuk operasi sensitif, silakan coba lagi setelah 1 jam'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    loginLimiter,
    registerLimiter,
    sensitiveRouteLimiter
};