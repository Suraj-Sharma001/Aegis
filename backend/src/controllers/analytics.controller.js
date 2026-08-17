import { prisma } from '../config/prisma.js';

// GET /applications/:id/analytics
// Summarizes spend and cache performance for one application — this is
// what turns your audit log from "just rows in a table" into the kind of
// numbers you'd put in a report or a dashboard chart.
export async function getAnalytics(req, res, next) {
  try {
    const { id: applicationId } = req.params;

    const application = await prisma.application.findFirst({
      where: { id: applicationId, organizationId: req.user.organizationId },
    });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const logs = await prisma.auditLog.findMany({ where: { applicationId } });

    const totalRequests = logs.length;
    const cacheHits = logs.filter((l) => l.cacheHit).length;
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;

    const totalCostUsd = logs.reduce((sum, l) => sum + l.costUsd, 0);
    const totalTokens = logs.reduce((sum, l) => sum + l.totalTokens, 0);

    // "Money saved by caching" = what cache hits WOULD have cost, based on
    // the tokens they returned. We don't store this per-row (cache hits
    // always log costUsd: 0), so this is an approximation using the average
    // cost-per-token of your non-cached calls — good enough for a report
    // chart, not meant to be penny-accurate.
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
