import { prisma } from '../config/prisma.js';
import { assertCanAccessApplication } from '../lib/authz.js';

// GET /applications/:id/analytics
export async function getAnalytics(req, res, next) {
  try {
    const { id: applicationId } = req.params;

    await assertCanAccessApplication(req.user, applicationId);

    const logs = await prisma.auditLog.findMany({ where: { applicationId } });

    const totalRequests = logs.length;
    const cacheHits = logs.filter((l) => l.cacheHit).length;
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

    const totalCostUsd = logs.reduce((sum, l) => sum + l.costUsd, 0);
    const totalTokens = logs.reduce((sum, l) => sum + l.totalTokens, 0);

    const successLogs = logs.filter((l) => l.status === 'SUCCESS' && l.totalTokens > 0);
    const avgCostPerToken =
      successLogs.length > 0
        ? successLogs.reduce((sum, l) => sum + l.costUsd / l.totalTokens, 0) / successLogs.length
        : 0;
    const cachedTokens = logs.filter((l) => l.cacheHit).reduce((sum, l) => sum + l.totalTokens, 0);
    const estimatedSavingsUsd = Number((cachedTokens * avgCostPerToken).toFixed(6));

    const avgLatencyMs =
      totalRequests > 0 ? Math.round(logs.reduce((sum, l) => sum + l.latencyMs, 0) / totalRequests) : 0;

    const byProvider = {};
    for (const log of logs) {
      if (!byProvider[log.provider]) {
        byProvider[log.provider] = { requests: 0, costUsd: 0, tokens: 0 };
      }
      byProvider[log.provider].requests += 1;
      byProvider[log.provider].costUsd += log.costUsd;
      byProvider[log.provider].tokens += log.totalTokens;
    }

    res.json({
      applicationId,
      totalRequests,
      cacheHits,
      cacheHitRate: Number(cacheHitRate.toFixed(1)),
      totalCostUsd: Number(totalCostUsd.toFixed(6)),
      estimatedSavingsUsd,
      totalTokens,
      avgLatencyMs,
      byProvider,
    });
  } catch (err) {
    next(err);
  }
}
