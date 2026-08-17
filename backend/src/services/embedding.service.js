const EMBEDDING_SERVICE_URL = process.env.EMBEDDING_SERVICE_URL || 'http://localhost:8001';

export async function embed(text) {
  const res = await fetch(`${EMBEDDING_SERVICE_URL}/embed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error(`Embedding service request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.embedding;
}