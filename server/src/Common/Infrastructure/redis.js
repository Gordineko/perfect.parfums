import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redis = createClient({
  url: redisUrl,
});

redis.on('error', (err) => {
  console.error('[redis] error', err);
});

let isConnected = false;

export async function connectRedis() {
  if (isConnected) return redis;

  try {
    await redis.connect();
    isConnected = true;
    console.log('[redis] connected');
    return redis;
  } catch (err) {
    isConnected = false;
    console.warn('[redis] unavailable, continue without cache:', err?.message || err);
    return null;
  }
}

export async function disconnectRedis() {
  if (!redis?.isOpen) return;

  try {
    await redis.quit();
    isConnected = false;
    console.log('[redis] disconnected');
  } catch (err) {
    console.warn('[redis] quit failed:', err?.message || err);
  }
}