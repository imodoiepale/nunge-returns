// lib/ai/gemini-client.ts
import { GoogleGenerativeAI, Content, Part, FunctionDeclaration, Tool } from '@google/generative-ai';

export interface AiMessage {
  role: 'user' | 'model' | 'system';
  content: string;
  functionCall?: { name: string; args: Record<string, any> };
  functionResponse?: { name: string; response: Record<string, any> };
}

export interface AiResponse {
  content: string;
  functionCalls?: { name: string; args: Record<string, any> }[];
  tokenCount?: { input: number; output: number; total: number };
  model: string;
  latencyMs: number;
  finishReason?: string;
}

export interface GeminiConfig {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  systemInstruction?: string;
  tools?: FunctionDeclaration[];
}

const DEFAULT_MODEL = 'gemini-2.0-flash';
let genAiInstance: GoogleGenerativeAI | null = null;

function getGenAi(): GoogleGenerativeAI {
  if (!genAiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not set');
    genAiInstance = new GoogleGenerativeAI(apiKey);
  }
  return genAiInstance;
}

function convertMessages(messages: AiMessage[]): Content[] {
  return messages.filter(m => m.role !== 'system').map(msg => {
    const parts: Part[] = [];
    if (msg.content) parts.push({ text: msg.content });
    if (msg.functionCall) parts.push({ functionCall: { name: msg.functionCall.name, args: msg.functionCall.args } } as Part);
    if (msg.functionResponse) parts.push({ functionResponse: { name: msg.functionResponse.name, response: msg.functionResponse.response } } as Part);
    return { role: msg.role === 'user' ? 'user' : 'model', parts } as Content;
  });
}

export async function chat(messages: AiMessage[], config: GeminiConfig = {}): Promise<AiResponse> {
  const modelName = config.model || DEFAULT_MODEL;
  const genAi = getGenAi();
  const startTime = Date.now();

  const modelConfig: any = {
    model: modelName,
    generationConfig: { temperature: config.temperature ?? 0.7, maxOutputTokens: config.maxOutputTokens ?? 4096, topP: config.topP ?? 0.95 },
  };

  const systemMsg = messages.find(m => m.role === 'system');
  if (systemMsg || config.systemInstruction) {
    modelConfig.systemInstruction = config.systemInstruction || systemMsg?.content;
  }
  if (config.tools?.length) {
    modelConfig.tools = [{ functionDeclarations: config.tools }] as Tool[];
  }

  const model = genAi.getGenerativeModel(modelConfig);
  const contents = convertMessages(messages);

  const result = await model.generateContent({ contents });
  const response = result.response;
  const latencyMs = Date.now() - startTime;
  const text = response.text ? response.text() : '';
  const candidates = response.candidates || [];

  const functionCalls: { name: string; args: Record<string, any> }[] = [];
  if (candidates[0]?.content?.parts) {
    for (const part of candidates[0].content.parts) {
      if ((part as any).functionCall) {
        functionCalls.push({ name: (part as any).functionCall.name, args: (part as any).functionCall.args || {} });
      }
    }
  }

  const usageMetadata = (response as any).usageMetadata;
  return {
    content: text,
    functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    tokenCount: usageMetadata ? { input: usageMetadata.promptTokenCount || 0, output: usageMetadata.candidatesTokenCount || 0, total: usageMetadata.totalTokenCount || 0 } : undefined,
    model: modelName, latencyMs,
    finishReason: candidates[0]?.finishReason || 'STOP',
  };
}

export async function complete(prompt: string, systemPrompt?: string, config: GeminiConfig = {}): Promise<AiResponse> {
  const messages: AiMessage[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });
  return chat(messages, config);
}

export async function classify(input: string, categories: string[]): Promise<{ category: string; confidence: number }> {
  const prompt = `Classify into one category: ${categories.join(', ')}.\nInput: "${input}"\nRespond ONLY with JSON: {"category":"...","confidence":0.0-1.0}`;
  const res = await complete(prompt, 'Classification assistant. JSON only.', { temperature: 0.1, maxOutputTokens: 100 });
  try { return JSON.parse(res.content.replace(/```json\n?|```\n?/g, '').trim()); } catch { return { category: categories[0], confidence: 0.5 }; }
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
