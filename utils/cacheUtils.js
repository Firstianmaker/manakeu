// utils/cacheUtils.js
const redis = require('../config/redis');

// Fungsi untuk invalidate single pattern
const invalidateCache = async (pattern) => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cache invalidated for pattern: ${pattern}, ${keys.length} keys removed`);
            return {
                success: true,
                message: `Cache invalidated: ${keys.length} keys`,
                pattern,
                keys
            };
        }
        return {
            success: true,
            message: 'No keys found to invalidate',
            pattern
        };
    } catch (error) {
        console.error('Cache invalidation error:', {
            error: error.message,
            pattern,
            stack: error.stack
        });
        return {
            success: false,
            message: 'Failed to invalidate cache',
            error: error.message,
            pattern
        };
    }
};

// Fungsi untuk invalidate multiple patterns
const invalidateMultipleCache = async (patterns) => {
    try {
        const results = await Promise.all(patterns.map(pattern => invalidateCache(pattern)));
        const success = results.every(result => result.success);
        
        return {
            success,
            results,
            totalPatternsProcessed: patterns.length,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Multiple cache invalidation error:', error);
        return {
            success: false,
            message: 'Failed to invalidate multiple cache patterns',
            error: error.message,
            patterns
        };
    }
};

// Fungsi untuk refresh cache (invalidate dan regenerate)
const refreshCache = async (pattern, regenerateFunction, ...args) => {
    try {
        // Invalidate existing cache
        await invalidateCache(pattern);

        // Regenerate cache
        if (regenerateFunction && typeof regenerateFunction === 'function') {
            const newData = await regenerateFunction(...args);
            const cacheKey = pattern.replace('*', ''); // Remove wildcard for specific key
            await redis.setex(cacheKey, 3600, JSON.stringify(newData)); // Default 1 hour TTL

            return {
                success: true,
                message: 'Cache successfully refreshed',
                pattern,
                newData
            };
        }

        return {
            success: true,
            message: 'Cache invalidated but not regenerated (no regenerate function provided)',
            pattern
        };

    } catch (error) {
        console.error('Cache refresh error:', error);
        return {
            success: false,
            message: 'Failed to refresh cache',
            error: error.message,
            pattern
        };
    }
};

// Fungsi untuk mengecek status cache
const getCacheStatus = async (pattern) => {
    try {
        const keys = await redis.keys(pattern);
        const status = {
            pattern,
            exists: keys.length > 0,
            keyCount: keys.length,
            keys: keys
        };

        if (keys.length > 0) {
            const ttls = await Promise.all(keys.map(key => redis.ttl(key)));
            status.ttls = keys.reduce((acc, key, index) => {
                acc[key] = ttls[index];
                return acc;
            }, {});
        }

        return {
            success: true,
            data: status
        };

    } catch (error) {
        console.error('Cache status check error:', error);
        return {
            success: false,
            message: 'Failed to check cache status',
            error: error.message,
            pattern
        };
    }
};

module.exports = {
    invalidateCache,
    invalidateMultipleCache,
    refreshCache,
    getCacheStatus
};