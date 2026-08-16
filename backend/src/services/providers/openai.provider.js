import OpenAI from 'openai';
import { env } from '../../config/env.js';

const client = new OpenAI({ apiKey: env.providers.openaiKey });

// Every provider adapter implements the same shape so the router/controller
// doesn't need to know which provider it's talking to.
export async function complete({ model, messages, temperature, max_tokens }) {
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
