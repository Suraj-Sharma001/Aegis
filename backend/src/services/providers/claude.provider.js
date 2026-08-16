import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';

const client = new Anthropic({ apiKey: env.providers.anthropicKey });

export async function complete({ model, messages, temperature, max_tokens }) {
  // Anthropic separates the system message from the conversation array
  const systemMsg = messages.find((m) => m.role === 'system')?.content;
  const conversation = messages.filter((m) => m.role !== 'system');

  const response = await client.messages.create({
    model,
    system: systemMsg,
    messages: conversation,
    temperature,
    max_tokens: max_tokens || 1024, // Anthropic requires max_tokens
  });

  return {
    content: response.content[0]?.text || '',
    promptTokens: response.usage?.input_tokens || 0,
    completionTokens: response.usage?.output_tokens || 0,
    totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
    raw: response,
  };
}
