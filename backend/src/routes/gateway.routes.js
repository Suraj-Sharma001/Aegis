import { Router } from 'express';
import { chatCompletion } from '../controllers/gateway.controller.js';
import { requireApiKey } from '../middleware/apiKey.middleware.js';
import { gatewayRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Every gateway call needs a valid API key AND passes through rate limiting.
// Order matters: auth first (so rate limiting can key off req.application.id).
router.post('/chat/completions', requireApiKey, gatewayRateLimiter, chatCompletion);

export default router;
