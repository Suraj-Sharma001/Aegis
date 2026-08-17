// ── Per-model pricing (USD per 1 MILLION tokens) ───────────────────────
// Source: provider pricing pages, checked mid-August 2026. Prices change
// often — if a model isn't in this table, we fall back to a conservative
// default rather than silently reporting $0 (which would understate cost
// in your analytics). Update this table periodically; it's the single
// place cost logic lives.
//
// NOTE for the report: this is exactly the kind of thing a production
// gateway would fetch from a live pricing API rather than hardcode — worth
// mentioning as a known limitation / future improvement.

const PRICING_PER_MILLION_TOKENS = {
  // ── OpenAI ──────────────────────────────────────────
  'gpt-4o': { input: 2.5, output: 10.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'gpt-4.1': { input: 2.0, output: 8.0 },
  'gpt-4.1-mini': { input: 0.4, output: 1.6 },
  'gpt-4.1-nano': { input: 0.1, output: 0.4 },

  // ── Anthropic / Claude ──────────────────────────────
  'claude-opus-5': { input: 5.0, output: 25.0 },
  'claude-sonnet-5': { input: 2.0, output: 10.0 },
  'claude-haiku-4-5-20251001': { input: 1.0, output: 5.0 },
  'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
  'claude-3-5-haiku-20241022': { input: 1.0, output: 5.0 },

  // ── Google Gemini ────────────────────────────────────
  'gemini-3.5-flash-lite': { input: 0.3, output: 2.5 },
  'gemini-3.6-flash': { input: 1.5, output: 7.5 },
  'gemini-3.1-pro': { input: 2.0, output: 12.0 },
  'gemini-2.5-flash-lite': { input: 0.1, output: 0.4 },

  // ── Ollama (local models — no per-token cost) ───────
  // Any model that reaches the OLLAMA provider is free — it's running on
  // your own machine, not billed by a provider.
};

// Used when a specific model isn't in the table above — better to slightly
// overestimate cost in analytics than silently show $0 for a real paid call.
const FALLBACK_PRICING = { input: 1.0, output: 5.0 };

/**
 * Calculates the cost in USD for a single completion.
 * @param {string} provider - 'OPENAI' | 'CLAUDE' | 'GEMINI' | 'OLLAMA'
 * @param {string} model - the exact model string used in the request
 * @param {number} promptTokens
 * @param {number} completionTokens
 * @returns {number} cost in USD, rounded to 6 decimal places
 */
export function calculateCost(provider, model, promptTokens, completionTokens) {
  // Local models cost nothing — this is a real, reportable saving, not a gap.
  if (provider === 'OLLAMA') return 0;

  const rates = PRICING_PER_MILLION_TOKENS[model?.toLowerCase()] || FALLBACK_PRICING;

  const inputCost = (promptTokens / 1_000_000) * rates.input;
  const outputCost = (completionTokens / 1_000_000) * rates.output;

  return Number((inputCost + outputCost).toFixed(6));
}
