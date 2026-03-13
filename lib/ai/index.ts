// lib/ai/index.ts
// Central export for AI engine modules

export * as gemini from './gemini-client';
export * as openai from './openai-client';
export * as router from './model-router';
export * as prompts from './prompt-engine';
export * as context from './context-manager';
export * as validator from './response-validator';

// Re-export key types
export type { AiMessage, AiResponse, GeminiConfig } from './gemini-client';
export type { RoutedResponse, ProviderUsed } from './model-router';
export type { ConversationContext } from './context-manager';
export type { ValidationResult, ValidationRule } from './response-validator';
export type { PromptTemplate } from './prompt-engine';
