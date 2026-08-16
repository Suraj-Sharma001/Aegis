import { env } from '../../config/env.js';

// Ollama has no official SDK — it exposes a simple REST API, so we call it directly.
export async function complete({ model, messages, temperature }) {
  const res = await fetch(`${env.providers.ollamaBaseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { temperature },
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();

  return {
    content: data.message?.content || '',
    // Ollama reports counts in different field names than the others
    promptTokens: data.prompt_eval_count || 0,
    completionTokens: data.eval_count || 0,
    totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
    raw: data,
  };
}
