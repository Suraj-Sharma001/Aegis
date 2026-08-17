import crypto from 'crypto';
import { redisClient } from '../config/redis.js';
import { embed } from './embedding.service.js';

// ── How this works ─────────────────────────────────────────────────────
// 1. Every cached entry is stored in Redis as a JSON string under key
//    "semcache:<uuid>", containing { embedding, model, response, promptText }.
// 2. On a new request, we embed the incoming prompt and compare it against
//    every cached entry FOR THAT MODEL using cosine similarity.
// 3. If the best match scores above SIMILARITY_THRESHOLD, it's a cache hit —
//    return the stored response, skip the real provider call entirely.
// 4. Otherwise it's a miss — caller proceeds to hit the real provider, then
//    calls set() to store the result for next time.
//
// NOTE: this is a simple linear-scan implementation — it compares against
// every cached entry in memory. Fine for a student project / demo scale
// (hundreds-thousands of entries). A production system would use a proper
// vector DB (pgvector, Pinecone, Redis's own vector search module) instead
// of scanning — worth mentioning as a "future work" point in your report.

const SIMILARITY_THRESHOLD = 0.93; // tune this: higher = stricter match required
const CACHE_KEY_PREFIX = 'semcache:';
const CACHE_TTL_SECONDS = 60 * 60 * 24; // cached entries expire after 24h

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Builds the last-user-message text used as the cache key basis. Keeping this
// simple (just the latest user turn) rather than the whole message history —
// full-conversation caching is a reasonable Phase 3 upgrade if you want it.
function extractCacheableText(messages) {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  return lastUserMsg?.content || '';
}

// Returns { content, promptTokens, completionTokens, totalTokens } if a
// similar-enough cached entry exists for this model, otherwise null.
export async function checkCache({ model, messages }) {
  try {
    const text = extractCacheableText(messages);
    if (!text) return null;

    const queryEmbedding = await embed(text);

    const keys = await redisClient.keys(`${CACHE_KEY_PREFIX}${model}:*`);
    if (keys.length === 0) return null;

    let bestMatch = null;
    let bestScore = 0;

    for (const key of keys) {
      const raw = await redisClient.get(key);
      if (!raw) continue;
      const entry = JSON.parse(raw);

      const score = cosineSimilarity(queryEmbedding, entry.embedding);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = entry;
      }
    }

    if (bestMatch && bestScore >= SIMILARITY_THRESHOLD) {
      return { ...bestMatch.response, similarityScore: bestScore };
    }

    return null;
  } catch (err) {
    // Cache failures should NEVER break the actual request — log and fall
    // through to a normal (uncached) provider call.
    console.error('[SemanticCache] checkCache failed, proceeding without cache:', err.message);
    return null;
  }
}

// Stores a fresh (prompt, response) pair for future similarity matching.
export async function storeInCache({ model, messages, response }) {
  try {
    const text = extractCacheableText(messages);
    if (!text) return;

    const embedding = await embed(text);
    const key = `${CACHE_KEY_PREFIX}${model}:${crypto.randomUUID()}`;

    const entry = {
      embedding,
      promptText: text,
      response: {
        content: response.content,
        promptTokens: response.promptTokens,
        completionTokens: response.completionTokens,
        totalTokens: response.totalTokens,
      },
    };

    await redisClient.set(key, JSON.stringify(entry), { EX: CACHE_TTL_SECONDS });
  } catch (err) {
    console.error('[SemanticCache] storeInCache failed (non-fatal):', err.message);
  }
}