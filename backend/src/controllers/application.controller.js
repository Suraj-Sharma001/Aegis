import crypto from 'crypto';
import { prisma } from '../config/prisma.js';
import { hashKey } from '../middleware/apiKey.middleware.js';
import { assertCanAccessApplication, getUserTeamIds } from '../lib/authz.js';

// POST /applications — creates a new application, now team-scoped.
// Admins can create in any team in their org. Developers/Viewers can only
// create in a team they're a member of — checked server-side, not just
// hidden in the UI dropdown.
export async function createApplication(req, res, next) {
  try {
    const { name, teamId } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!teamId) return res.status(400).json({ error: 'teamId is required' });

    const team = await prisma.team.findFirst({
      where: { id: teamId, organizationId: req.user.organizationId },
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });

    if (req.user.role !== 'ADMIN') {
      const teamIds = await getUserTeamIds(req.user.id);
      if (!teamIds.includes(teamId)) {
        return res.status(403).json({ error: 'You are not a member of that team' });
      }
    }

    const application = await prisma.application.create({
      data: { name, organizationId: req.user.organizationId, teamId },
    });

    res.status(201).json(application);
  } catch (err) {
    next(err);
  }
}

// GET /applications — Admins see every application in the org. Everyone
// else only sees applications belonging to a team they're a member of.
export async function listApplications(req, res, next) {
  try {
    const where =
      req.user.role === 'ADMIN'
        ? { organizationId: req.user.organizationId }
        : { organizationId: req.user.organizationId, teamId: { in: await getUserTeamIds(req.user.id) } };

    const applications = await prisma.application.findMany({
      where,
      include: {
        _count: { select: { auditLogs: true, apiKeys: true } },
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
}

export async function createApiKey(req, res, next) {
  try {
    const { id: applicationId } = req.params;
    const { label } = req.body;

    await assertCanAccessApplication(req.user, applicationId);

    const rawKey = `aegis_${crypto.randomBytes(24).toString('hex')}`;
    const hashed = hashKey(rawKey);

    await prisma.apiKey.create({
      data: { key: hashed, label: label || 'Default key', applicationId, createdById: req.user.id },
    });

    res.status(201).json({ apiKey: rawKey, warning: 'Save this key now — it will not be shown again.' });
  } catch (err) {
    next(err);
  }
}

export async function listApiKeys(req, res, next) {
  try {
    const { id: applicationId } = req.params;
    await assertCanAccessApplication(req.user, applicationId);

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

export async function listAuditLogs(req, res, next) {
  try {
    const { id: applicationId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 50, 200);

    await assertCanAccessApplication(req.user, applicationId);

    const logs = await prisma.auditLog.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true, provider: true, model: true, status: true, promptTokens: true,
        completionTokens: true, totalTokens: true, latencyMs: true, costUsd: true,
        cacheHit: true, errorMessage: true, createdAt: true,
      },
    });

    res.json(logs);
  } catch (err) {
    next(err);
  }
}
