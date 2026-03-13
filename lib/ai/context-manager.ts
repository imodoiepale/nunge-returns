// lib/ai/context-manager.ts
// Manages conversation context with sliding window and auto-summarization

import { supabase } from '@/lib/supabaseClient';
import type { AiMessage } from './gemini-client';

const MAX_MESSAGES = 20;           // sliding window size
const SUMMARIZE_THRESHOLD = 15;    // trigger summarization at this count
const MAX_CONTEXT_TOKENS = 8000;   // approximate token budget for context

export interface ConversationContext {
  conversationId: string;
  messages: AiMessage[];
  summary: string | null;
  tokenEstimate: number;
  metadata: Record<string, any>;
}

// Rough token estimate: ~4 chars per token
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function estimateMessagesTokens(messages: AiMessage[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content || ''), 0);
}

/**
 * Load conversation context from Supabase
 */
export async function loadContext(conversationId: string): Promise<ConversationContext> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .select('messages, context_summary, token_count, metadata')
    .eq('id', conversationId)
    .single();

  if (error || !data) {
    return {
      conversationId,
      messages: [],
      summary: null,
      tokenEstimate: 0,
      metadata: {},
    };
  }

  return {
    conversationId,
    messages: (data.messages || []) as AiMessage[],
    summary: data.context_summary,
    tokenEstimate: data.token_count || 0,
    metadata: data.metadata || {},
  };
}

/**
 * Save conversation context to Supabase
 */
export async function saveContext(context: ConversationContext): Promise<void> {
  const tokenEstimate = estimateMessagesTokens(context.messages) + estimateTokens(context.summary || '');

  const { error } = await supabase
    .from('ai_conversations')
    .update({
      messages: context.messages,
      context_summary: context.summary,
      token_count: tokenEstimate,
      metadata: context.metadata,
    })
    .eq('id', context.conversationId);

  if (error) {
    console.error('[CONTEXT] Failed to save context:', error);
  }
}

/**
 * Add a message to context, applying sliding window if needed
 */
export function addMessage(context: ConversationContext, message: AiMessage): ConversationContext {
  const updated = { ...context, messages: [...context.messages, message] };

  // Apply sliding window
  if (updated.messages.length > MAX_MESSAGES) {
    const dropped = updated.messages.splice(0, updated.messages.length - MAX_MESSAGES);
    // Append dropped content to summary request (will be summarized on next AI call)
    const droppedText = dropped.map(m => `${m.role}: ${m.content}`).join('\n');
    updated.metadata._pendingSummarization = (updated.metadata._pendingSummarization || '') + '\n' + droppedText;
  }

  updated.tokenEstimate = estimateMessagesTokens(updated.messages) + estimateTokens(updated.summary || '');
  return updated;
}

/**
 * Build the messages array for an AI call, including summary context
 */
export function buildContextMessages(context: ConversationContext, systemPrompt: string): AiMessage[] {
  const messages: AiMessage[] = [];

  // System prompt with conversation summary injected
  let fullSystemPrompt = systemPrompt;
  if (context.summary) {
    fullSystemPrompt += `\n\nConversation summary so far:\n${context.summary}`;
  }
  messages.push({ role: 'system', content: fullSystemPrompt });

  // Recent messages (within sliding window)
  for (const msg of context.messages) {
    messages.push(msg);
  }

  return messages;
}

/**
 * Generate a summarization prompt for older context
 * Call this when context.metadata._pendingSummarization exists
 */
export function getSummarizationPrompt(context: ConversationContext): string | null {
  const pending = context.metadata._pendingSummarization;
  if (!pending) return null;

  const existingSummary = context.summary || 'No previous summary.';
  return `Summarize the following conversation history into a concise paragraph. Preserve key facts: user's KRA PIN, service requested, payment status, any obligations selected, and current step in the process.

Previous summary: ${existingSummary}

New messages to incorporate:
${pending}

Provide ONLY the updated summary paragraph, nothing else.`;
}

/**
 * Apply a generated summary and clear pending summarization
 */
export function applySummary(context: ConversationContext, summary: string): ConversationContext {
  return {
    ...context,
    summary,
    metadata: { ...context.metadata, _pendingSummarization: undefined },
  };
}

/**
 * Create a new conversation in the database
 */
export async function createConversation(channel: 'whatsapp' | 'web' | 'api', externalId?: string, metadata?: Record<string, any>): Promise<string> {
  const { data, error } = await supabase
    .from('ai_conversations')
    .insert({
      channel,
      external_id: externalId || null,
      messages: [],
      metadata: metadata || {},
      status: 'active',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create conversation: ${error.message}`);
  return data.id;
}

/**
 * Mark a conversation as completed
 */
export async function completeConversation(conversationId: string): Promise<void> {
  await supabase
    .from('ai_conversations')
    .update({ status: 'completed' })
    .eq('id', conversationId);
}
