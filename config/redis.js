// config/redis.js
const Redis = require('ioredis');

const redis = new Redis({
    host: 'localhost',
    port: 6379,
    // password: process.env.REDIS_PASSWORD // uncomment jika menggunakan password
});

module.exports = redis;