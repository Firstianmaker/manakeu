const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

// Konfigurasi Redis Store dengan format yang benar untuk versi 2.1.0
const redisStore = new RedisStore({
    client: redis,  // Gunakan client redis langsung
    prefix: 'rl:', // Prefix untuk key di Redis
    windowMs: 15 * 60 * 1000 // Sinkronkan dengan windowMs di limiter
});

const redisApiLimiter = rateLimit({
    store: redisStore,
    windowMs: 5 * 60 * 1000, // 5 menit
    max: 50, // Lebih ketat
    message: {
        status: 'error',
        message: 'Rate limit untuk Redis API tercapai'
    }
});

// Limiter untuk API secara umum
const apiLimiter = rateLimit({
    store: redisStore,
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
    store: redisStore,
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
    store: redisStore,
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
    store: redisStore,
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
    sensitiveRouteLimiter,
    redisApiLimiter
};