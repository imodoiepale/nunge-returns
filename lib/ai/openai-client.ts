// lib/ai/openai-client.ts
import OpenAI from 'openai';
import type { AiMessage, AiResponse, GeminiConfig } from './gemini-client';

const DEFAULT_MODEL = 'gpt-4o';
let openaiInstance: OpenAI | null = null;

function getOpenAi(): OpenAI {
  if (!openaiInstance) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error('OPENAI_API_KEY not set');
    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

function convertMessages(messages: AiMessage[]): OpenAI.ChatCompletionMessageParam[] {
  return messages.map(msg => {
    if (msg.role === 'system') return { role: 'system' as const, content: msg.content };
    if (msg.role === 'model') return { role: 'assistant' as const, content: msg.content };
    return { role: 'user' as const, content: msg.content };
  });
}

function convertTools(tools?: GeminiConfig['tools']): OpenAI.ChatCompletionTool[] | undefined {
  if (!tools?.length) return undefined;
  return tools.map(t => ({
    type: 'function' as const,
    function: { name: t.name, description: t.description || '', parameters: t.parameters as any },
  }));
}

export async function chat(messages: AiMessage[], config: GeminiConfig = {}): Promise<AiResponse> {
  const modelName = config.model || DEFAULT_MODEL;
  const openai = getOpenAi();
  const startTime = Date.now();

  const params: OpenAI.ChatCompletionCreateParams = {
    model: modelName,
    messages: convertMessages(messages),
    temperature: config.temperature ?? 0.7,
    max_tokens: config.maxOutputTokens ?? 4096,
    top_p: config.topP ?? 0.95,
  };

  const tools = convertTools(config.tools);
  if (tools) params.tools = tools;

  const result = await openai.chat.completions.create(params);
  const latencyMs = Date.now() - startTime;
  const choice = result.choices[0];

  const functionCalls: { name: string; args: Record<string, any> }[] = [];
  if (choice.message.tool_calls) {
    for (const tc of choice.message.tool_calls) {
      if (tc.type === 'function') {
        try {
          functionCalls.push({ name: tc.function.name, args: JSON.parse(tc.function.arguments) });
        } catch { functionCalls.push({ name: tc.function.name, args: {} }); }
      }
    }
  }

  return {
    content: choice.message.content || '',
    functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    tokenCount: result.usage ? { input: result.usage.prompt_tokens, output: result.usage.completion_tokens, total: result.usage.total_tokens } : undefined,
    model: modelName,
    latencyMs,
    finishReason: choice.finish_reason || 'stop',
  };
}

export async function complete(prompt: string, systemPrompt?: string, config: GeminiConfig = {}): Promise<AiResponse> {
  const messages: AiMessage[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });
  return chat(messages, config);
}

export async function healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
  try {
    const start = Date.now();
    await complete('Say "ok"', undefined, { maxOutputTokens: 10, temperature: 0 });
    return { healthy: true, latencyMs: Date.now() - start };
  } catch (e: any) {
    return { healthy: false, latencyMs: 0, error: e.message };
  }
}
