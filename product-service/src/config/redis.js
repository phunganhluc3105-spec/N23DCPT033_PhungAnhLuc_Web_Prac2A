// src/config/redis.js
const Redis = require("ioredis");

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

let redisClient = null;
let isRedisConnected = false;

try {
  redisClient = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        console.warn("⚠️ [Redis] Không thể kết nối Redis sau 3 lần thử. Chuyển sang chế độ chạy không cache.");
        return null; // Không retry vô tận
      }
      return Math.min(times * 1000, 3000);
    },
    lazyConnect: true,
  });

  redisClient.connect().then(() => {
    isRedisConnected = true;
    console.log("⚡ [Redis] Đã kết nối thành công tới Redis Cache!");
  }).catch((err) => {
    isRedisConnected = false;
    console.warn(`⚠️ [Redis] Kết nối thất bại: ${err.message}. Hệ thống tiếp tục chạy không cache.`);
  });

  redisClient.on("error", (err) => {
    isRedisConnected = false;
  });

  redisClient.on("ready", () => {
    isRedisConnected = true;
  });
} catch (error) {
  console.warn("⚠️ [Redis] Lỗi khởi tạo Redis client:", error.message);
  isRedisConnected = false;
}

// Helper lấy dữ liệu cache an toàn
const getCache = async (key) => {
  if (!isRedisConnected || !redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.warn(`[Redis Cache Error] Get ${key}:`, error.message);
    return null;
  }
};

// Helper lưu dữ liệu vào cache với TTL (mặc định 300s = 5 phút)
const setCache = async (key, value, ttlSeconds = 300) => {
  if (!isRedisConnected || !redisClient) return;
  try {
    await redisClient.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (error) {
    console.warn(`[Redis Cache Error] Set ${key}:`, error.message);
  }
};

// Helper xoá cache theo pattern (ví dụ: 'products:*') khi có mutation POST/PUT/DELETE
const clearCachePattern = async (pattern = "products:*") => {
  if (!isRedisConnected || !redisClient) return;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      await redisClient.del(...keys);
      console.log(`🧹 [Redis] Đã xoá ${keys.length} cache keys cho pattern '${pattern}'`);
    }
  } catch (error) {
    console.warn(`[Redis Cache Error] Clear ${pattern}:`, error.message);
  }
};

module.exports = {
  redisClient,
  getCache,
  setCache,
  clearCachePattern,
};
