import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { hashKey } from '../middleware/apiKey.middleware.js';

// POST /applications — create a new client application under the org
export async function createApplication(req, res, next) {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const application = await prisma.application.create({
      data: { name, organizationId: req.user.organizationId },
    });

    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
}

// GET /applications — list apps for the caller's org
export async function listApplications(req, res, next) {
  try {
    const applications = await prisma.application.findMany({
      where: { organizationId: req.user.organizationId },
      include: { _count: { select: { auditLogs: true, apiKeys: true } } },
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
}

// POST /applications/:id/keys — issue a new gateway API key for an application
// The raw key is returned ONCE — only the hash is stored, same pattern as
// GitHub/Stripe API keys. Client apps use this as x-api-key on gateway calls.
export async function createApiKey(req, res, next) {
  try {
    const { id: applicationId } = req.params;
    const { label } = req.body;

    const application = await prisma.application.findFirst({
      where: { id: applicationId, organizationId: req.user.organizationId },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const rawKey = `aegis_${crypto.randomBytes(24).toString('hex')}`;
    const hashed = hashKey(rawKey);

    await prisma.apiKey.create({
      data: {
        key: hashed,
        label: label || 'Default key',
        applicationId,
        createdById: req.user.id,
      },
    });

    // This is the only time the raw key is ever visible — tell the user to save it.
    res.status(201).json({ apiKey: rawKey, warning: 'Save this key now — it will not be shown again.' });
  } catch (err) {
    next(err);
  }
}
