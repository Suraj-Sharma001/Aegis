import { createClient } from 'redis';
import { env } from './env.js';

export const redisClient = createClient({ url: env.redisUrl });

redisClient.on('error', (err) => console.error('[Redis] Client Error', err));

// Top-level await: this runs the moment ANY file imports redis.js, and ES
// modules fully finish evaluating a dependency before the importing file
// continues. That guarantees Redis is connected before rateLimiter.js (which
// builds a RedisStore at import time) ever runs — no manual sequencing needed.
if (!redisClient.isOpen) {
  await redisClient.connect();
  console.log('[Redis] Connected');
}

export async function connectRedis() {
  // Kept for compatibility — connection already happened above on import.
  return redisClient;
}