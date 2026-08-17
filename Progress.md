# Aegis — Progress So Far (Explained Simply)

This file explains what we've built, in plain language, and how to test it.
No prior context needed — read top to bottom.

---

## The Big Idea

Aegis is a **middleman server** that sits between your apps and AI providers
(OpenAI, Gemini, Claude, etc). Instead of your app talking to each AI
provider separately, it talks to Aegis once, and Aegis handles the rest —
routing, security, caching, cost tracking, logging.

Think of it like a **universal remote** for AI models.

---

## Phase 1 — The Foundation ✅ Done

The base layer everything else sits on top of.

**What it does:**
- **Login system** — users can register/login, get a security token (JWT)
- **Applications & API Keys** — each "app" that wants to use Aegis gets its
  own API key (like how you get an API key from OpenAI)
- **The Gateway** — one endpoint (`/v1/chat/completions`) that accepts a
  request and forwards it to the right AI provider based on the `model`
  name you send (e.g. `gpt-4o` → OpenAI, `gemini-3.5-flash-lite` → Gemini)
- **Audit Log** — every request (success or failure) gets saved to the
  database — who called it, which model, how long it took, etc.

**Three different "keys" you'll use — don't mix them up:**

| Key | What it's for |
|---|---|
| **JWT token** (from login) | Proves *you* are logged into the dashboard |
| **Aegis API key** (`aegis_...`) | Proves *your app* is allowed to call the gateway |
| **Provider key** (Gemini/OpenAI key, in `.env`) | Lets *Aegis itself* call the real AI provider |

---

## Phase 2 — Smart (Semantic) Caching ✅ Done

**The problem it solves:** if 100 users ask the AI the same question in
slightly different words ("What's the capital of France?" vs "Which city
is the capital of France?"), normally you'd pay for and wait on 100
separate AI calls — even though the answer is the same.

**How it works:**
1. Every question gets converted into a list of numbers ("embedding")
   representing its *meaning*, using a small local Python service
   (`sentence-transformers`, model `all-MiniLM-L6-v2`).
2. Aegis checks if a *similar-meaning* question was asked before (not just
   identical text).
3. If yes → return the saved answer instantly, skip calling the AI.
4. If no → call the AI normally, then save this new question+answer.

**Proven results (tested Aug 17, 2026):**
| Test | Latency | Similarity Score |
|---|---|---|
| First-ever question | ~2,500ms | — |
| Exact same question again | 39ms | 1.0 |
| Reworded question, same meaning | 39ms | 0.94 |

That's a ~98% latency drop on cache hits, and proof it understands
*meaning*, not just exact text.

---

## Phase 3 — Cost Tracking ✅ Done

**The problem it solves:** without this, you have no idea what your AI
usage is actually costing — Phase 1's audit log recorded token counts, but
`costUsd` was hardcoded to `0`.

**How it works:**
1. A pricing table maps every model to its real $-per-token rate (OpenAI,
   Claude, Gemini rates — checked mid-Aug 2026). Local/Ollama models are
   always free.
2. Every gateway call now calculates and returns real `cost_usd`.
3. Cache hits calculate what they *would have* cost, returned as
   `cost_saved_usd` — this is your "caching saves real money" proof.
4. A new endpoint, `GET /applications/:id/analytics`, rolls all of this up:
   total requests, cache hit rate, total spend, estimated savings, and a
   cost breakdown per provider.

**Proven results (tested Aug 17, 2026):**
```json
{
  "totalRequests": 17,
  "cacheHits": 5,
  "cacheHitRate": 29.4,
  "totalCostUsd": 0.00031,
  "estimatedSavingsUsd": 0.000041,
  "byProvider": { "GEMINI": { "requests": 17, "costUsd": 0.00031, "tokens": 478 } }
}
```
Real numbers, not placeholders — good material for your report.

---

## What's Running Right Now (3 separate things)

While developing, you need **3 things running at the same time**, each in
its own terminal window:

| # | What | Command | Where |
|---|---|---|---|
| 1 | Database + Redis | `docker compose up -d` | `Aegis/` (root folder) |
| 2 | Embedding service | `uvicorn app:app --port 8001` | `Aegis/embedding-service/` |
| 3 | Main backend | `npm run dev` | `Aegis/backend/` |

Plus, your `.env` file (in `backend/`) needs a real Gemini API key — no
local install needed for that part, Gemini is a free cloud API.

---

## How to Test It (Postman or PowerShell)

**Step 1 — Register/Login** → get a JWT token
**Step 2 — Create an Application** → get an `applicationId`
**Step 3 — Issue an API key for that app** → get an `aegis_...` key
**Step 4 — Call the gateway:**

```
POST http://localhost:8080/v1/chat/completions
Header: x-api-key: aegis_your_key_here
Body: {"model":"gemini-3.5-flash-lite","messages":[{"role":"user","content":"What is the capital of France?"}]}
```

**Testing the cache + cost tracking together:**
1. Send the request once → normal speed, `cache_hit: false`, real `cost_usd`.
2. Send the **exact same** request again → fast, `cache_hit: true`,
   `cost_usd: 0`, `cost_saved_usd` shows what you avoided paying.
3. Send a **reworded** version → still hits the cache, `similarity_score`
   close to (but under) 1.0.

**Checking overall stats:**
```
GET http://localhost:8080/applications/YOUR_APP_ID/analytics
Header: Authorization: Bearer YOUR_JWT
```
Returns the full picture: total requests, cache hit rate, total spend,
savings, and per-provider breakdown.

---

## Current Status

- ✅ Phase 1 — Foundation (auth, gateway, provider routing, audit log)
- ✅ Phase 2 — Semantic caching (Redis + sentence-transformers)
- ✅ Phase 3 — Cost tracking (pricing table, savings, analytics endpoint)

## What's Next (Not Started Yet)

- **Governance/PII layer** — detect and mask sensitive data (names, card
  numbers, secrets) in prompts before they reach the AI provider. This is
  featured in the presentation deck (slide 9) and is the other genuinely
  "hard" differentiator feature worth building next.
- **RBAC-based model restrictions** — e.g. interns only get local models
  (deck slide 8) — the `Role` field exists in the DB but this specific
  restriction logic isn't wired in yet.
- **Provider key rotation / per-org provider keys** — currently all
  customers share one `.env` with your keys; a real enterprise version
  would let each org bring their own (the `ProviderKey` DB table already
  supports this, just not wired into routing).
- **Admin dashboard** — a visual UI (Next.js) instead of Postman/PowerShell.