const winston = require('winston');
const { format } = winston;
const path = require('path');

// Format custom
const customFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
);

// Konfigurasi logger
const logger = winston.createLogger({
    level: 'info',
    format: customFormat,
    defaultMeta: { service: 'manakeu-api' },
    transports: [
        // Log error ke file terpisah
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/error.log'), 
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            silent: process.env.NODE_ENV === 'test' // Tidak log saat testing
        }),
        // Log semua level ke file terpisah
        new winston.transports.File({ 
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
            silent: process.env.NODE_ENV === 'test' // Tidak log saat testing
        })
    ]
});

// Middleware untuk logging HTTP requests
const requestLogger = (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        
        // Hanya log ke file untuk request penting
        if (res.statusCode >= 400 || req.method !== 'GET') {
            logger.info('HTTP Request', {
                method: req.method,
                url: req.originalUrl,
                status: res.statusCode,
                duration: `${duration}ms`,
                userIP: req.ip,
                userAgent: req.get('user-agent')
            });
        }
    });
    next();
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    // Log error ke file
    logger.error('Uncaught Exception', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        params: req.params,
        query: req.query,
        user: req.user ? req.user.ID_User : null
    });

    res.status(500).json({
        status: 'error',
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
};

module.exports = {
    logger,
    requestLogger,
    errorHandler
};