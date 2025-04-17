const express = require('express');
const router = express.Router();
const db = require('../config/database');
const redis = require('../config/redis');
const { logger } = require('../utils/logger');
const PerformanceMonitor = require('../utils/performance');

// Fungsi untuk cek koneksi database
const checkDatabase = async () => {
    try {
        await db.promise().query('SELECT 1');
        return { status: 'up', responseTime: null };
    } catch (error) {
        logger.error('Database health check failed', { error: error.message });
        return { status: 'down', error: error.message };
    }
};

// Fungsi untuk cek koneksi Redis
const checkRedis = async () => {
    try {
        const startTime = performance.now();
        await redis.ping();
        const responseTime = performance.now() - startTime;
        return { status: 'up', responseTime: `${responseTime.toFixed(2)}ms` };
    } catch (error) {
        logger.error('Redis health check failed', { error: error.message });
        return { status: 'down', error: error.message };
    }
};

// Health check endpoint
router.get('/', async (req, res) => {
    const monitor = new PerformanceMonitor();
    monitor.startMeasure('health-check');

    const [dbStatus, redisStatus] = await Promise.all([
        checkDatabase(),
        checkRedis()
    ]);

    // Cek penggunaan memori
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    const duration = monitor.endMeasure('health-check');

    const healthStatus = {
        status: dbStatus.status === 'up' && redisStatus.status === 'up' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
        services: {
            database: dbStatus,
            redis: redisStatus
        },
        system: {
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`
            },
            responseTime: `${duration.toFixed(2)}ms`
        }
    };

    // Log health check result
    logger.info('Health Check Result', healthStatus);

    res.status(healthStatus.status === 'healthy' ? 200 : 503).json(healthStatus);
});

module.exports = router;