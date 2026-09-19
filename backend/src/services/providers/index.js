import { prisma } from '../../config/prisma.js';
import { decrypt } from '../../lib/crypto.js';
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

export function inferProvider(model) {
  const m = model.toLowerCase();
  if (m.startsWith('gpt') || m.startsWith('o1') || m.startsWith('o3')) return 'OPENAI';
  if (m.startsWith('claude')) return 'CLAUDE';
  if (m.startsWith('gemini')) return 'GEMINI';
  return 'OLLAMA';
}

// Looks up and decrypts the CALLING ORGANIZATION's own key for a provider.
// Deliberately has no fallback to a shared/.env key — BYOK means every
// org's usage is billed to their own account, or the request fails with a
// clear, actionable error telling them to add one.
async function resolveApiKey(organizationId, provider) {
  if (provider === 'OLLAMA') return null; // local models need no key

  const record = await prisma.providerKey.findFirst({
    where: { organizationId, provider, isActive: true },
  });

  if (!record) {
    const err = new Error(
      `No ${provider} API key configured for your organization. Add one from the Provider Keys page before using ${provider} models.`
    );
    err.statusCode = 400;
    err.expose = true;
    throw err;
  }

  return decrypt(record.encryptedKey);
}

export async function routeCompletion({ model, messages, temperature, max_tokens, provider, organizationId }) {
  const resolvedProvider = provider || inferProvider(model);
  const adapter = adapters[resolvedProvider];

  if (!adapter) {
    const err = new Error(`Unsupported provider: ${resolvedProvider}`);
    err.statusCode = 400;
    err.expose = true;
    throw err;
  }

  const apiKey = await resolveApiKey(organizationId, resolvedProvider);

  const startTime = Date.now();
  try {
    const result = await adapter.complete({ model, messages, temperature, max_tokens, apiKey });
    return { ...result, provider: resolvedProvider, latencyMs: Date.now() - startTime };
  } catch (err) {
    err.provider = resolvedProvider;
    err.latencyMs = Date.now() - startTime;
    throw err;
  }
}
