// Core dependencies
const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');
const session = require('express-session');
require('dotenv').config();

// Import middleware & Utility
const { apiLimiter } = require('./middleware/rateLimiter');
const securityMiddleware = require('./middleware/security');
const { requestLogger, errorHandler } = require('./utils/logger');
const PerformanceMonitor = require('./utils/performance');
const PatchManagement = require('./utils/patchManagement');

// Import routes
const approvalRoutes = require('./routes/approvalRoutes');
const authRoutes = require('./routes/authRoutes');
const complexTransactionRoutes = require('./routes/complexTransactionRoutes'); // API COMPLEX
const healthCheckRouter = require('./routes/healthCheck');
const logAktivitasRoutes = require('./routes/logAktivitasRoutes');
const notaRoutes = require('./routes/notaRoutes');
const projectRoutes = require('./routes/projectRoutes');
const redisRoutes = require('./routes/redisRoutes'); // API REDIS NOSQL
const transaksiRoutes = require('./routes/transaksiRoutes');
const userRoutes = require('./routes/userRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

// Membuat aplikasi Express
const app = express();

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Session dan Authentication middleware
app.use(session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 jam
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Security middleware
app.use(securityMiddleware.helmet);
app.use(securityMiddleware.cors);
app.use(securityMiddleware.additionalHeaders);

// Rate limiting
app.use('/api', apiLimiter);

// Logging & Monitoring middleware
app.use(requestLogger);
app.use(PerformanceMonitor.apiMetrics);

// Health check route (harus di atas route lain)
app.use('/api/health', healthCheckRouter);

// API Routes
app.use('/api/approval', approvalRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/complex', complexTransactionRoutes);
app.use('/api/logs', logAktivitasRoutes);
app.use('/api/nota', notaRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/redis', redisRoutes);
app.use('/api/transaksi', transaksiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/whatsapp', whatsappRoutes);

app.use(express.static('public'));

// Basic route untuk testing
app.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Manakeu API Server berjalan!',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Schedule memory usage logging (setiap 1 jam)
setInterval(() => {
    PerformanceMonitor.logMemoryUsage();
}, 3600000);

PatchManagement.scheduleChecks();

// Handle 404 - harus setelah semua routes
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        message: 'Ada kesalahan! Route tidak ditemukan'
    });
});

// Error handler middleware - harus di paling akhir
app.use(errorHandler);

// Server initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('Health check tersedia di: /api/health');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    app.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

module.exports = app;