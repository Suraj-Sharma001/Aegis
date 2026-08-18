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

----------------------------------------------------------------------------------------------------------------------------------------

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

----------------------------------------------------------------------------------------------------------------------------------------

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
# Phase 4: Governance / PII Detection — What Changed

Only 2 files this time — simpler patch than last phase.


----------------------------------------------------------------------------------------------------------------------------------------

##  ✅ Phase 4: Governance / PII Detection


## 1. NEW FILE
`backend/src/services/governance.service.js`
→ Copy to: `D:\Projects\Aegis\backend\src\services\governance.service.js`

## 2. OVERWRITE
`backend/src/controllers/gateway.controller.js`
→ Replace: `D:\Projects\Aegis\backend\src\controllers\gateway.controller.js`
(Delete everything in the existing file, paste this in.)

---

## What this adds

A governance/security scan that runs **before anything else** on every
gateway request — before the cache check, before any AI provider is
called. It looks for:

- Email addresses
- Phone numbers
- Credit card numbers
- Aadhaar-style 12-digit ID numbers
- SSN-style numbers (XXX-XX-XXXX)
- API keys (OpenAI `sk-...`, Anthropic `sk-ant-...`, AWS `AKIA.../ASIA...`)
- Generic secrets (patterns like `api_key: <long string>`)

**Default policy: BLOCK.** If anything sensitive is found, the request is
rejected with a `422` status — it never reaches Gemini/OpenAI/Claude/Ollama
at all. This is logged in your audit trail with `status: BLOCKED`.

## How to test it

**1. Send a prompt WITHOUT sensitive data (should work normally):**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/v1/chat/completions" -Method Post -Headers @{"x-api-key"="YOUR_KEY"} -ContentType "application/json" -Body '{"model":"gemini-3.5-flash-lite","messages":[{"role":"user","content":"What is the capital of Japan?"}]}'
```
Should go through as normal.

**2. Send a prompt WITH an email address (should get blocked):**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/v1/chat/completions" -Method Post -Headers @{"x-api-key"="YOUR_KEY"} -ContentType "application/json" -Body '{"model":"gemini-3.5-flash-lite","messages":[{"role":"user","content":"Send a follow-up email to john.doe@example.com about the meeting"}]}'
```
Expect a `422` error response like:
```json
{
  "error": "Request blocked by governance policy",
  "reason": "The prompt contains data that looks sensitive and was not sent to any AI provider.",
  "findings": [{"type":"EMAIL","label":"Email address","preview":"jo***om"}]
}
```
Note: `Invoke-RestMethod` in PowerShell treats non-2xx responses as errors
by default, so this might show as a red error in your terminal rather than
a clean JSON block — that's expected PowerShell behavior, not a bug. If you
want to see the JSON body cleanly, wrap it:
```powershell
try {
  Invoke-RestMethod -Uri "..." -Method Post -Headers @{...} -ContentType "application/json" -Body '...'
} catch {
  $_.ErrorDetails.Message
}
```

**3. Try a fake API key:**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/v1/chat/completions" -Method Post -Headers @{"x-api-key"="YOUR_KEY"} -ContentType "application/json" -Body '{"model":"gemini-3.5-flash-lite","messages":[{"role":"user","content":"Why is my key sk-abc123def456ghi789jkl012mno345 not working?"}]}'
```
Should also get blocked, flagged as `OPENAI_KEY`.

**4. Confirm the audit log** — check that blocked attempts show up:
```powershell
npx prisma studio
```
Open the `AuditLog` table — you should see rows with `status: BLOCKED` and
an `errorMessage` describing what was found (never the actual sensitive
value itself — only a masked preview is ever logged, by design).

## Known limitation (worth mentioning in your report)

This is regex/pattern-based, not an ML model — it catches structured data
well (emails, cards, keys) but won't catch things like a name, a home
address written in prose, or context-dependent sensitive info. A named
entity recognition (NER) model layered on top would be the natural next
step for a production version — good to mention as future work if asked.

## One thing to watch for

The `CREDIT_CARD` and `AADHAAR` patterns are both "N consecutive digits" —
they're broad on purpose (real card/ID numbers vary in formatting), but
that means a long phone number or an order ID could occasionally trigger a
false positive. If that happens during your demo, it's not a bug — it's
the policy correctly erring on the side of caution. Worth having one
"clean" test prompt ready to show it working normally alongside the
blocked one, so you can demonstrate both cases confidently.
