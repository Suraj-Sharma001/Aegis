import { prisma } from '../config/prisma.js';
import { routeCompletion } from '../services/providers/index.js';
import { chatCompletionSchema, validate } from '../utils/validators.js';

// POST /v1/chat/completions
// This is Aegis's "unified API" — one endpoint, any provider, based on `model`.
// Phase 1: straight passthrough + audit logging.
// Phase 2 adds: semantic cache check (before routeCompletion), governance/PII
// scan (before routeCompletion), and cost calculation (after, using a
// per-model pricing table instead of the placeholder 0 below).
export async function chatCompletion(req, res, next) {
  let result;
  try {
    const data = validate(chatCompletionSchema, req.body);

    result = await routeCompletion(data);

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
        costUsd: 0, // TODO Phase 2: look up per-model $/token pricing table
        cacheHit: false,
      },
    });

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
