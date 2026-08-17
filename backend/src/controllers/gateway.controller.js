import { prisma } from '../config/prisma.js';
import { routeCompletion, inferProvider } from '../services/providers/index.js';
import { chatCompletionSchema, validate } from '../utils/validators.js';
import { checkCache, storeInCache } from '../services/semanticCache.service.js';
import { calculateCost } from '../services/pricing.service.js';

// POST /v1/chat/completions
// This is Aegis's "unified API" — one endpoint, any provider, based on `model`.
// Phase 2: added semantic cache check before the provider call — if a
// similar-enough prompt was answered before, return that instantly instead
// of paying for/waiting on another provider round-trip.
// Still TODO: governance/PII scan (before routeCompletion), and cost
// calculation using a per-model pricing table instead of the placeholder 0.
export async function chatCompletion(req, res, next) {
  const startTime = Date.now();
  try {
    const data = validate(chatCompletionSchema, req.body);

    // ── 1. Check semantic cache first ──────────────────────────────
    const cached = await checkCache({ model: data.model, messages: data.messages });

    if (cached) {
      // Cache hits cost nothing — but we still calculate what it WOULD have
      // cost, so you can report "$X saved via caching" as a real number.
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
          costUsd: 0, // actual cost is always 0 on a cache hit
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

    // ── 2. Cache miss — call the real provider ─────────────────────
    const result = await routeCompletion(data);

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

    // ── 3. Store this fresh response for future cache hits ─────────
    // Fire-and-forget — don't make the client wait on this.
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
    // Log failures too — this is what makes the audit trail actually useful
    // for debugging provider outages / failover decisions later.
    if (req.application) {
      await prisma.auditLog
        .create({
          data: {
            applicationId: req.application.id,
            provider: err.provider || 'OPENAI',
            model: req.body?.model || 'unknown',
            status: 'ERROR',
            latencyMs: err.latencyMs || 0,
            errorMessage: err.message,
          },
        })
        .catch(() => {}); // never let logging failure mask the real error
    }
    next(err);
  }
}
