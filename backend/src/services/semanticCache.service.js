import crypto from 'crypto';
import { redisClient } from '../config/redis.js';
import { embed } from './embedding.service.js';

// ── How this works ─────────────────────────────────────────────────────
// HYBRID matching: pure embedding similarity alone was unreliable for
// short, differently-worded questions (measured 0.76-0.84 across several
// embedding models for genuinely-matching pairs like "What is AI?" vs
// "What do you mean by AI, explain in simple words"). Rather than keep
// swapping embedding models, we combine TWO signals:
//
//   1. Embedding similarity (cosine) — captures semantic closeness
//   2. Keyword overlap — do the two texts share their core content words?
//
// Decision rule:
//   - embeddingScore >= STRICT (0.90)  → accept regardless of keywords
//     (very high confidence semantic match on its own)
//   - embeddingScore >= LOOSE (0.65) AND keywordOverlap >= 0.5
//     → accept (moderate semantic signal, confirmed by shared keywords)
//   - otherwise → reject
//
// This is a standard "hybrid retrieval" pattern — semantic-only matching
// is brittle on short text, lexical-only matching misses true paraphrases
// entirely; combining both is more robust than either alone.

const EMBEDDING_STRICT = 0.90;
const EMBEDDING_LOOSE = 0.65;
const KEYWORD_OVERLAP_THRESHOLD = 0.5;

const CACHE_KEY_PREFIX = 'semcache:';
const CACHE_TTL_SECONDS = 60 * 60 * 24; // cached entries expire after 24h

// Common words that carry little topic-identifying signal — filtered out
// before comparing keyword sets so "what is X" and "explain me X" both
// reduce down to just the meaningful word: X.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'what', 'which', 'who', 'whom', 'this', 'that',
  'these', 'those', 'you', 'your', 'me', 'my', 'i', 'it', 'its', 'in',
  'on', 'at', 'by', 'for', 'with', 'about', 'to', 'of', 'and', 'or',
  'explain', 'mean', 'means', 'meaning', 'simple', 'words', 'word',
  'please', 'tell', 'give', 'can', 'could', 'would', 'should',
]);

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Normalizes text before embedding/keyword extraction — lowercases,
// strips punctuation, collapses whitespace.
function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extracts the meaningful "content" words from normalized text, dropping
// stopwords and single-character tokens.
function extractKeywords(normalizedText) {
  return new Set(
    normalizedText.split(' ').filter((w) => w.length > 1 && !STOPWORDS.has(w))
  );
}

// Overlap ratio relative to the SMALLER set — so a short query like "ai"
// (one keyword) fully contained in a longer query scores 1.0, not
// penalized just for being short.
function keywordOverlap(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  let intersection = 0;
  for (const w of setA) if (setB.has(w)) intersection++;
  return intersection / Math.min(setA.size, setB.size);
}

function extractCacheableText(messages) {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  return lastUserMsg?.content ? normalizeText(lastUserMsg.content) : '';
}

// Returns { content, promptTokens, completionTokens, totalTokens } if a
// hybrid-matching cached entry exists for this model, otherwise null.
export async function checkCache({ model, messages }) {
  try {
    const text = extractCacheableText(messages);
    if (!text) return null;

    const queryEmbedding = await embed(text);
    const queryKeywords = extractKeywords(text);

    const keys = await redisClient.keys(`${CACHE_KEY_PREFIX}${model}:*`);
    if (keys.length === 0) return null;

    let bestMatch = null;
    let bestScore = 0;
    let bestOverlap = 0;

    for (const key of keys) {
      const raw = await redisClient.get(key);
      if (!raw) continue;
      const entry = JSON.parse(raw);

      const embeddingScore = cosineSimilarity(queryEmbedding, entry.embedding);
      const entryKeywords = new Set(entry.keywords || []);
      const overlap = keywordOverlap(queryKeywords, entryKeywords);

      const isMatch =
        embeddingScore >= EMBEDDING_STRICT ||
        (embeddingScore >= EMBEDDING_LOOSE && overlap >= KEYWORD_OVERLAP_THRESHOLD);

      if (isMatch && embeddingScore > bestScore) {
        bestScore = embeddingScore;
        bestOverlap = overlap;
        bestMatch = entry;
      }
    }

    console.log(
      `[SemanticCache] best: embedding=${bestScore.toFixed(4)} keywordOverlap=${bestOverlap.toFixed(2)} ` +
      `candidates=${keys.length} matched=${!!bestMatch}`
    );

    if (bestMatch) {
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

// Stores a fresh (prompt, response) pair — now including its keyword set —
// for future hybrid matching.
export async function storeInCache({ model, messages, response }) {
  try {
    const text = extractCacheableText(messages);
    if (!text) return;

    const embedding = await embed(text);
    const keywords = Array.from(extractKeywords(text));
    const key = `${CACHE_KEY_PREFIX}${model}:${crypto.randomUUID()}`;

    const entry = {
      embedding,
      keywords,
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
