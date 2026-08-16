import crypto from 'crypto';
import { prisma } from '../config/prisma.js';

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

// Protects gateway routes (/v1/chat/completions etc.) — expects "x-api-key: <key>"
// This is DIFFERENT from requireAuth: dashboard users log in with JWT,
// but client applications call the gateway itself with a long-lived API key.
export async function requireApiKey(req, res, next) {
  try {
    const rawKey = req.headers['x-api-key'];
    if (!rawKey) {
      return res.status(401).json({ error: 'Missing x-api-key header' });
    }

    const hashed = hashKey(rawKey);
    const apiKey = await prisma.apiKey.findUnique({
      where: { key: hashed },
      include: { application: { include: { organization: true } } },
    });

    if (!apiKey || !apiKey.isActive) {
      return res.status(401).json({ error: 'Invalid or revoked API key' });
    }

    // Fire-and-forget last-used timestamp update (don't block the request on it)
    prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } }).catch(() => {});

    req.application = apiKey.application;
    req.organizationId = apiKey.application.organizationId;
    next();
  } catch (err) {
    next(err);
  }
}

export { hashKey };
