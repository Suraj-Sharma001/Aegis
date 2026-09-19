import Anthropic from '@anthropic-ai/sdk';

export async function complete({ model, messages, temperature, max_tokens, apiKey }) {
  const client = new Anthropic({ apiKey });

  const systemMsg = messages.find((m) => m.role === 'system')?.content;
  const conversation = messages.filter((m) => m.role !== 'system');

  const response = await client.messages.create({
    model,
    system: systemMsg,
    messages: conversation,
    temperature,
    max_tokens: max_tokens || 1024,
  });

  return {
    content: response.content[0]?.text || '',
    promptTokens: response.usage?.input_tokens || 0,
    completionTokens: response.usage?.output_tokens || 0,
    totalTokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
    raw: response,
  };
}
