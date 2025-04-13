const rateLimit = require('express-rate-limit');

// Throttling untuk transaksi
const transactionThrottler = rateLimit({
    windowMs: 1000, // 1 detik
    max: 1, // 1 request per detik
    message: {
        error: 'Mohon tunggu sebentar sebelum melakukan transaksi baru'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Throttling untuk approval
const approvalThrottler = rateLimit({
    windowMs: 2000, // 2 detik
    max: 1, // 1 request per 2 detik
    message: {
        error: 'Mohon tunggu sebentar sebelum melakukan approval baru'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Throttling untuk update data
const updateThrottler = rateLimit({
    windowMs: 1000, // 1 detik
    max: 2, // 2 request per detik
    message: {
        error: 'Terlalu banyak permintaan update, mohon tunggu sebentar'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    transactionThrottler,
    approvalThrottler,
    updateThrottler
};