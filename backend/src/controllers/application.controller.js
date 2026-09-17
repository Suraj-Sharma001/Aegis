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

    res.status(201).json({ apiKey: rawKey, warning: 'Save this key now — it will not be shown again.' });
  } catch (err) {
    next(err);
  }
}

// GET /applications/:id/keys — list keys already issued for an application
export async function listApiKeys(req, res, next) {
  try {
    const { id: applicationId } = req.params;

    const application = await prisma.application.findFirst({
      where: { id: applicationId, organizationId: req.user.organizationId },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const keys = await prisma.apiKey.findMany({
      where: { applicationId },
      select: { id: true, label: true, isActive: true, lastUsedAt: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    res.json(keys);
  } catch (err) {
    next(err);
  }
}

// GET /applications/:id/logs — recent raw audit log entries for an application.
// This powers the Logs page — a per-request view, distinct from the
// aggregated numbers on the Analytics/Usage page. Same underlying table
// (AuditLog), just unaggregated and capped to the most recent N rows.
export async function listAuditLogs(req, res, next) {
  try {
    const { id: applicationId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    const application = await prisma.application.findFirst({
      where: { id: applicationId, organizationId: req.user.organizationId },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const logs = await prisma.auditLog.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        provider: true,
        model: true,
        status: true,
        promptTokens: true,
        completionTokens: true,
        totalTokens: true,
        latencyMs: true,
        costUsd: true,
        cacheHit: true,
        errorMessage: true,
        createdAt: true,
      },
    });

    res.json(logs);
  } catch (err) {
    next(err);
  }
}
