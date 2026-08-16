import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';

const genAI = new GoogleGenerativeAI(env.providers.geminiKey);

export async function complete({ model, messages, temperature, max_tokens }) {
  const genModel = genAI.getGenerativeModel({ model });

  // Gemini wants system instructions separate + a plain history/prompt format
  const systemMsg = messages.find((m) => m.role === 'system')?.content;
  const history = messages
    .filter((m) => m.role !== 'system')
    .slice(0, -1)
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const lastMessage = messages[messages.length - 1].content;

  const chat = genModel.startChat({
    history,
    systemInstruction: systemMsg,
    generationConfig: { temperature, maxOutputTokens: max_tokens },
  });

  const result = await chat.sendMessage(lastMessage);
  const response = result.response;
  const usage = response.usageMetadata || {};

  return {
    content: response.text(),
    promptTokens: usage.promptTokenCount || 0,
    completionTokens: usage.candidatesTokenCount || 0,
    totalTokens: usage.totalTokenCount || 0,
    raw: response,
  };
}
