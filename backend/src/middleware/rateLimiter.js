import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisClient } from '../config/redis.js';
import { env } from '../config/env.js';

// Rate limits by application (from apiKey.middleware) rather than raw IP —
// so each client app gets its own quota regardless of where requests originate.
export const gatewayRateLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.application?.id || req.ip,
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
    prefix: 'ratelimit:',
  }),
  message: { error: 'Rate limit exceeded. Please slow down.' },
});
