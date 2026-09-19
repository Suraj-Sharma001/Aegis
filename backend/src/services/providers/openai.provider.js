import OpenAI from 'openai';

// The client is now created PER REQUEST using the calling organization's
// own key — not a single shared client built once at import time from
// .env. This is the core of BYOK: every org's OpenAI usage is billed to
// their own account, using their own credentials.
export async function complete({ model, messages, temperature, max_tokens, apiKey }) {
  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model,
    messages,
    temperature,
    max_tokens,
  });

  return {
    content: response.choices[0].message.content,
    promptTokens: response.usage?.prompt_tokens || 0,
    completionTokens: response.usage?.completion_tokens || 0,
    totalTokens: response.usage?.total_tokens || 0,
    raw: response,
  };
}
