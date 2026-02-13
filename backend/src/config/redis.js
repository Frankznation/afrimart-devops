const redis = require('redis');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.error('❌ Too many Redis reconnection attempts');
            return new Error('Too many retries');
          }
          return retries * 100;
        }
      }
    });

    redisClient.on('error', (err) => console.error('Redis Client Error:', err));
    redisClient.on('connect', () => console.log('✅ Redis connected'));
    redisClient.on('reconnecting', () => console.log('⚠️  Redis reconnecting...'));

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    // Don't exit - app can work without Redis, but with degraded performance
  }
};

const getRedisClient = () => redisClient;

// Cache helper functions
const cacheGet = async (key) => {
  try {
    if (!redisClient || !redisClient.isOpen) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
};

const cacheSet = async (key, value, ttl = 3600) => {
  try {
    if (!redisClient || !redisClient.isOpen) return false;
    await redisClient.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
};

const cacheDel = async (key) => {
  try {
    if (!redisClient || !redisClient.isOpen) return false;
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
};

const cacheFlush = async () => {
  try {
    if (!redisClient || !redisClient.isOpen) return false;
    await redisClient.flushAll();
    return true;
  } catch (error) {
    console.error('Cache flush error:', error);
    return false;
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  cacheGet,
  cacheSet,
  cacheDel,
  cacheFlush
};
