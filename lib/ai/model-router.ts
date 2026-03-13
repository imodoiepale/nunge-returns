// lib/ai/model-router.ts
// Routes AI requests: Gemini primary → OpenAI fallback with circuit breaker

import * as gemini from './gemini-client';
import * as openai from './openai-client';
import type { AiMessage, AiResponse, GeminiConfig } from './gemini-client';

interface ModelHealth {
  consecutiveFailures: number;
  lastFailure: number;
  totalRequests: number;
  totalFailures: number;
  avgLatencyMs: number;
  circuitOpen: boolean;
  circuitOpenUntil: number;
}

const CIRCUIT_BREAK_THRESHOLD = 3;    // failures before opening circuit
const CIRCUIT_BREAK_WINDOW = 5 * 60 * 1000;  // 5 min window for counting failures
const CIRCUIT_OPEN_DURATION = 10 * 60 * 1000; // 10 min cooldown

const health: Record<string, ModelHealth> = {
  gemini: { consecutiveFailures: 0, lastFailure: 0, totalRequests: 0, totalFailures: 0, avgLatencyMs: 0, circuitOpen: false, circuitOpenUntil: 0 },
  openai: { consecutiveFailures: 0, lastFailure: 0, totalRequests: 0, totalFailures: 0, avgLatencyMs: 0, circuitOpen: false, circuitOpenUntil: 0 },
};

function isCircuitOpen(provider: string): boolean {
  const h = health[provider];
  if (!h.circuitOpen) return false;
  if (Date.now() > h.circuitOpenUntil) {
    h.circuitOpen = false;
    h.consecutiveFailures = 0;
    return false;
  }
  return true;
}

function recordSuccess(provider: string, latencyMs: number): void {
  const h = health[provider];
  h.consecutiveFailures = 0;
  h.totalRequests++;
  h.avgLatencyMs = Math.round((h.avgLatencyMs * (h.totalRequests - 1) + latencyMs) / h.totalRequests);
}

function recordFailure(provider: string): void {
  const h = health[provider];
  h.consecutiveFailures++;
  h.totalFailures++;
  h.totalRequests++;
  h.lastFailure = Date.now();

  if (h.consecutiveFailures >= CIRCUIT_BREAK_THRESHOLD) {
    h.circuitOpen = true;
    h.circuitOpenUntil = Date.now() + CIRCUIT_OPEN_DURATION;
    console.warn(`[MODEL-ROUTER] Circuit opened for ${provider} until ${new Date(h.circuitOpenUntil).toISOString()}`);
  }
}

export type ProviderUsed = 'gemini' | 'openai';

export interface RoutedResponse extends AiResponse {
  provider: ProviderUsed;
  fallbackUsed: boolean;
}

/**
 * Route a chat request through Gemini first, fallback to OpenAI on failure
 */
export async function chat(messages: AiMessage[], config: GeminiConfig = {}): Promise<RoutedResponse> {
  // Try Gemini first (if circuit is closed)
  if (!isCircuitOpen('gemini')) {
    try {
      const geminiConfig = { ...config };
      // Ensure we use Gemini model name
      if (!geminiConfig.model || geminiConfig.model.startsWith('gpt')) {
        geminiConfig.model = 'gemini-2.0-flash';
      }
      const response = await gemini.chat(messages, geminiConfig);
      recordSuccess('gemini', response.latencyMs);
      return { ...response, provider: 'gemini', fallbackUsed: false };
    } catch (error: any) {
      console.error(`[MODEL-ROUTER] Gemini failed: ${error.message}`);
      recordFailure('gemini');
    }
  }

  // Fallback to OpenAI
  if (!isCircuitOpen('openai')) {
    try {
      const openaiConfig = { ...config };
      // Ensure we use OpenAI model name
      if (!openaiConfig.model || openaiConfig.model.startsWith('gemini')) {
        openaiConfig.model = 'gpt-4o';
      }
      const response = await openai.chat(messages, openaiConfig);
      recordSuccess('openai', response.latencyMs);
      return { ...response, provider: 'openai', fallbackUsed: true };
    } catch (error: any) {
      console.error(`[MODEL-ROUTER] OpenAI also failed: ${error.message}`);
      recordFailure('openai');
      throw new Error(`All AI providers failed. Gemini: circuit=${isCircuitOpen('gemini')}. OpenAI: ${error.message}`);
    }
  }

  throw new Error('All AI providers have open circuits. System is temporarily unavailable.');
}

/**
 * Simple completion through the router
 */
export async function complete(prompt: string, systemPrompt?: string, config: GeminiConfig = {}): Promise<RoutedResponse> {
  const messages: AiMessage[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: prompt });
  return chat(messages, config);
}

/**
 * Get health status of all providers
 */
export function getHealthStatus(): Record<string, ModelHealth & { circuitState: string }> {
  const result: Record<string, any> = {};
  for (const [provider, h] of Object.entries(health)) {
    result[provider] = {
      ...h,
      circuitState: h.circuitOpen ? (Date.now() > h.circuitOpenUntil ? 'half-open' : 'open') : 'closed',
      successRate: h.totalRequests > 0 ? ((h.totalRequests - h.totalFailures) / h.totalRequests * 100).toFixed(1) + '%' : 'N/A',
    };
  }
  return result;
}

/**
 * Force reset a provider's circuit (for admin use)
 */
export function resetCircuit(provider: string): void {
  if (health[provider]) {
    health[provider].circuitOpen = false;
    health[provider].consecutiveFailures = 0;
    health[provider].circuitOpenUntil = 0;
  }
}

export { type AiMessage, type AiResponse, type GeminiConfig };
