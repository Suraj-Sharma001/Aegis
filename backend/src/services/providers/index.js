import * as openaiProvider from './openai.provider.js';
import * as claudeProvider from './claude.provider.js';
import * as geminiProvider from './gemini.provider.js';
import * as ollamaProvider from './ollama.provider.js';

const adapters = {
  OPENAI: openaiProvider,
  CLAUDE: claudeProvider,
  GEMINI: geminiProvider,
  OLLAMA: ollamaProvider,
};

// Phase 1: infer provider from a model-name prefix so callers can just say
// model: "gpt-4o" or "claude-3-5-sonnet-20241022" without specifying provider.
// Phase 2 (intelligent routing) will replace/extend this with cost/latency/
// capability-based selection — this function is the seam where that plugs in.
export function inferProvider(model) {
  const m = model.toLowerCase();
  if (m.startsWith('gpt') || m.startsWith('o1') || m.startsWith('o3')) return 'OPENAI';
  if (m.startsWith('claude')) return 'CLAUDE';
  if (m.startsWith('gemini')) return 'GEMINI';
  // Anything else is assumed to be a locally-hosted Ollama model (llama3, mistral, etc.)
  return 'OLLAMA';
}

export async function routeCompletion({ model, messages, temperature, max_tokens, provider }) {
  const resolvedProvider = provider || inferProvider(model);
  const adapter = adapters[resolvedProvider];

  if (!adapter) {
    const err = new Error(`Unsupported provider: ${resolvedProvider}`);
    err.statusCode = 400;
    err.expose = true;
    throw err;
  }

  const startTime = Date.now();
  try {
    const result = await adapter.complete({ model, messages, temperature, max_tokens });
    return { ...result, provider: resolvedProvider, latencyMs: Date.now() - startTime };
  } catch (err) {
    err.provider = resolvedProvider;
    err.latencyMs = Date.now() - startTime;
    throw err;
  }
}
