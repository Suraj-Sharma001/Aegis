import { prisma } from '../config/prisma.js';
import { routeCompletion, inferProvider } from '../services/providers/index.js';
import { chatCompletionSchema, validate } from '../utils/validators.js';
import { checkCache, storeInCache } from '../services/semanticCache.service.js';
import { calculateCost } from '../services/pricing.service.js';
import { scanMessages, maskFindings } from '../services/governance.service.js';

export async function chatCompletion(req, res, next) {
  const startTime = Date.now();
  try {
    const data = validate(chatCompletionSchema, req.body);

    // ── 0. Governance / PII scan ─────────────────────────────────────
    const findings = scanMessages(data.messages);
    if (findings.length > 0) {
      await prisma.auditLog.create({
        data: {
          applicationId: req.application.id,
          provider: inferProvider(data.model),
          model: data.model,
          status: 'BLOCKED',
          latencyMs: Date.now() - startTime,
          costUsd: 0,
          cacheHit: false,
          errorMessage: `Blocked: ${findings.map((f) => f.label).join(', ')}`,
        },
      });

      return res.status(422).json({
        error: 'Request blocked by governance policy',
        reason: 'The prompt contains data that looks sensitive and was not sent to any AI provider.',
        findings: maskFindings(findings),
      });
    }

    // ── 1. Semantic cache check ──────────────────────────────────────
    const cached = await checkCache({ model: data.model, messages: data.messages });

    if (cached) {
      const wouldHaveCost = calculateCost(
        inferProvider(data.model),
        data.model,
        cached.promptTokens,
        cached.completionTokens
      );

      await prisma.auditLog.create({
        data: {
          applicationId: req.application.id,
          provider: inferProvider(data.model),
          model: data.model,
          status: 'CACHED',
          promptTokens: cached.promptTokens,
          completionTokens: cached.completionTokens,
          totalTokens: cached.totalTokens,
          latencyMs: Date.now() - startTime,
          costUsd: 0,
          cacheHit: true,
        },
      });

      return res.json({
        model: data.model,
        provider: inferProvider(data.model),
        content: cached.content,
        usage: {
          prompt_tokens: cached.promptTokens,
          completion_tokens: cached.completionTokens,
          total_tokens: cached.totalTokens,
        },
        latency_ms: Date.now() - startTime,
        cache_hit: true,
        similarity_score: cached.similarityScore,
        cost_usd: 0,
        cost_saved_usd: wouldHaveCost,
      });
    }

    // ── 2. Cache miss — call the real provider using the ORG's own key ─
    const result = await routeCompletion({ ...data, organizationId: req.organizationId });

    const costUsd = calculateCost(result.provider, data.model, result.promptTokens, result.completionTokens);

    await prisma.auditLog.create({
      data: {
        applicationId: req.application.id,
        provider: result.provider,
        model: data.model,
        status: 'SUCCESS',
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        latencyMs: result.latencyMs,
        costUsd,
        cacheHit: false,
      },
    });

    storeInCache({ model: data.model, messages: data.messages, response: result }).catch(() => {});

    res.json({
      model: data.model,
      provider: result.provider,
      content: result.content,
      usage: {
        prompt_tokens: result.promptTokens,
        completion_tokens: result.completionTokens,
        total_tokens: result.totalTokens,
      },
      latency_ms: result.latencyMs,
      cache_hit: false,
      cost_usd: costUsd,
    });
  } catch (err) {
    if (req.application) {
      await prisma.auditLog
        .create({
          data: {
            applicationId: req.application.id,
            provider: err.provider || inferProvider(req.body?.model || ''),
            model: req.body?.model || 'unknown',
            status: 'ERROR',
            latencyMs: err.latencyMs || 0,
            errorMessage: err.message,
          },
        })
        .catch(() => {});
    }
    next(err);
  }
}
