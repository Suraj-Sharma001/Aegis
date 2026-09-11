"""
Aegis Embedding Service — lightweight local embedding server.

Model history:
  1. all-MiniLM-L6-v2 (general purpose) — too weak on paraphrases
  2. paraphrase-MiniLM-L6-v2 — measured 0.76 on "What is AI?" vs
     "Explain me AI" — good at statement-paraphrase, weak on
     question-vs-command intent matching
  3. multi-qa-MiniLM-L6-cos-v1 — measured 0.8364 on the same pair, better,
     but still short of a safe threshold
  4. BAAI/bge-base-en-v1.5 (this version) — a stronger, larger model that
     currently ranks near the top of public embedding benchmarks (MTEB)
     for semantic similarity. Handles cases with different LENGTH and
     STRUCTURE (e.g. a short direct question vs. a longer conversational
     rephrasing) meaningfully better than the smaller MiniLM-family models
     used before. Slightly slower per request, still fast enough on CPU
     for this use case.

BGE models are trained to expect a specific instruction prefix on the
query side for retrieval tasks — this is a documented characteristic of
the model, not something invented here. We apply it to every embedded
string since the cache compares queries against other queries
symmetrically.

Run: uvicorn app:app --port 8001
"""

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI(title="Aegis Embedding Service")

# Loaded once at startup — kept in memory, each request just runs inference.
# First run after this change downloads this model's weights (~440MB —
# bigger than the previous MiniLM-family models, expect a longer first start).
model = SentenceTransformer("BAAI/bge-base-en-v1.5")

# BGE's documented recommendation: prefix short queries with this instruction
# for retrieval-style tasks. Improves matching quality measurably per the
# model's own published evaluation.
QUERY_PREFIX = "Represent this sentence for searching relevant passages: "


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]


@app.get("/health")
def health():
    return {"status": "ok", "model": "BAAI/bge-base-en-v1.5"}


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    prefixed = QUERY_PREFIX + req.text
    vector = model.encode(prefixed, normalize_embeddings=True)
    return {"embedding": vector.tolist()}
