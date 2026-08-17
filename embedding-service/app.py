"""
Aegis Embedding Service — lightweight local embedding server.

Uses sentence-transformers with all-MiniLM-L6-v2 (~80MB, CPU-only, fast) to
convert text into vectors for the semantic cache. This replaces Ollama for
embeddings — much lighter, no need to run/manage the Ollama app at all just
for this one piece.

Run: uvicorn app:app --port 8001
"""

from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI(title="Aegis Embedding Service")

model = SentenceTransformer("all-MiniLM-L6-v2")


class EmbedRequest(BaseModel):
    text: str


class EmbedResponse(BaseModel):
    embedding: list[float]


@app.get("/health")
def health():
    return {"status": "ok", "model": "all-MiniLM-L6-v2"}


@app.post("/embed", response_model=EmbedResponse)
def embed(req: EmbedRequest):
    vector = model.encode(req.text, normalize_embeddings=True)
    return {"embedding": vector.tolist()}