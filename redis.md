# Embedding Model Upgrade: BAAI/bge-base-en-v1.5

## Why this one

Your test case — "What is AI?" vs. "What do you mean by AI, explain in
simple words" — is a HARDER matching problem than same-length paraphrasing:
different length, different structure, same underlying question. BGE
(`bge-base-en-v1.5`) is currently one of the strongest open embedding
models for exactly this kind of cross-length semantic matching, ranking
near the top of public embedding benchmarks (MTEB).

Trade-off: it's a bigger model than what you had (~440MB vs ~90MB), so
the first download takes longer and each embedding call is a bit slower
— still fine for this use case, just not instant.

## Steps

1. Stop the embedding service (Ctrl+C)
2. Replace `app.py`
3. Restart: `uvicorn app:app --port 8001`
   — first run downloads ~440MB, will take noticeably longer than before
4. **Flush Redis again** — old vectors are from a different model and
   space, meaningless to compare against new ones:
   ```powershell
   docker exec -it aegis-redis redis-cli FLUSHALL

whether it's already comfortably above it.


# Hybrid Semantic Cache — Embedding + Keyword Overlap

## Why this approach, finally

We tried 3 different embedding models. Each one scored your test pairs
somewhere in the 0.76-0.84 range — none reliably crossed a safe threshold
on their own, and a "stronger" model (BGE) actually scored LOWER on your
latest test than a smaller one did. That told us pure embedding similarity
alone isn't going to solve this reliably for short, differently-phrased
questions — so instead of chasing another model, this fix adds a SECOND,
independent signal: keyword overlap.

## The decision rule

- Embedding score ≥ **0.90** → accept immediately (very high confidence
  semantic match, no other check needed)
- Embedding score ≥ **0.65** AND the two texts share at least half their
  core keywords → accept (moderate semantic signal, CONFIRMED by shared
  topic words)
- Anything else → reject


## Steps

1. Replace `semanticCache.service.js`
2. Your backend (`npm run dev`) should auto-restart
3. Flush Redis — old cached entries don't have the new `keywords`
   field, so they'd be treated as having zero keyword overlap:
   ```powershell
   docker exec -it aegis-redis redis-cli FLUSHALL
   ```

## Test — both a positive AND a negative case

**Positive (should now hit):**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/v1/chat/completions" -Method Post -Headers @{"x-api-key"="YOUR_KEY"} -ContentType "application/json" -Body '{"model":"gemini-3.5-flash-lite","messages":[{"role":"user","content":"What is AI?"}]}'
```
then
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/v1/chat/completions" -Method Post -Headers @{"x-api-key"="YOUR_KEY"} -ContentType "application/json" -Body '{"model":"gemini-3.5-flash-lite","messages":[{"role":"user","content":"What do you mean by AI explain in simple words"}]}'
```

**Negative (should still miss — important to confirm this too):**
```powershell
Invoke-RestMethod -Uri "http://localhost:8080/v1/chat/completions" -Method Post -Headers @{"x-api-key"="YOUR_KEY"} -ContentType "application/json" -Body '{"model":"gemini-3.5-flash-lite","messages":[{"role":"user","content":"What is the capital of Germany?"}]}'
```

Check your backend terminal — the log line now shows both numbers:
```
[SemanticCache] best: embedding=0.7643 keywordOverlap=1.00 candidates=1 matched=true
```

Paste me what you get for both the positive and negative test — I want to
confirm this doesn't just fix your one example while breaking something
else.

## For user report

This is a legitimate, real technique — combining semantic (embedding) and
lexical (keyword) signals is a standard "hybrid retrieval" pattern used in
production search/caching systems specifically because pure embedding
similarity is known to be unreliable on short text. You can honestly
describe this as: "measured that pure semantic similarity alone was
insufficient for short queries (0.76-0.84 range), and implemented a hybrid
scoring approach combining embedding similarity with keyword overlap to
improve match reliability" — that's a real engineering decision backed by
real measured data from your own testing.
