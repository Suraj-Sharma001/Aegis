import OpenAI from 'openai';

// xAI (Grok) uses an OpenAI-compatible API endpoint
// Base URL: https://api.x.ai/v1
export async function complete({ model, messages, temperature, max_tokens, apiKey }) {
  const client = new OpenAI({
    apiKey,
    baseURL: 'https://api.x.ai/v1',
  });

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