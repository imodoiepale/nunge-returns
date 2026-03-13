// lib/agents/orchestrator.ts
// JARVIS Brain — receives user intent, decomposes into tasks, delegates to sub-agents

import * as router from '../ai/model-router';
import * as prompts from '../ai/prompt-engine';
import * as contextMgr from '../ai/context-manager';
import * as validator from '../ai/response-validator';
import { guardPrompt } from '../security/prompt-guard';
import { logPromptInjection } from '../security/audit-logger';
import { createTask, getTasksByConversation, type AgentType } from './task-manager';
import { findAgentsForTask } from './agent-registry';

export interface UserIntent {
  intent: string;
  service: string | null;
  entities: {
    pin?: string;
    phone?: string;
    obligation_ids?: string[];
    reason?: string;
  };
  confidence: number;
  requiresConfirmation: boolean;
}

const INTENT_CLASSIFICATION_PROMPT = `Classify the user's message into one of these intents:
- file_nil_return_individual: User wants to file nil tax returns (individual)
- file_nil_return_company: User wants to file nil returns for a company
- terminate_obligation: User wants to deregister/terminate a tax obligation
- reset_password: User wants to reset their KRA password
- change_email: User wants to change their KRA email
- check_status: User wants to check filing/task status
- check_obligations: User wants to see company obligations
- make_payment: User wants to make a payment
- get_support: User needs help or has a complaint
- greeting: User is greeting or starting a conversation
- unknown: Cannot determine intent

Also extract any entities: KRA PIN (format A/P + 9 digits + letter), phone number, obligation names.

Respond ONLY with JSON:
{"intent":"...","service":"...","entities":{"pin":"...","phone":"..."},"confidence":0.0-1.0,"requiresConfirmation":false}`;

/**
 * Process an incoming user message through the orchestrator
 */
export async function processMessage(
  conversationId: string,
  userMessage: string,
  channel: 'whatsapp' | 'web' | 'api' = 'web'
): Promise<{ response: string; tasks: string[]; intent: UserIntent | null }> {
  // 1. Security check
  const guardResult = await guardPrompt(userMessage);
  if (!guardResult.safe) {
    await logPromptInjection(userMessage, guardResult.label || 'unknown');
    return {
      response: "I'm sorry, I couldn't process that message. Could you please rephrase your request?",
      tasks: [],
      intent: null,
    };
  }

  // 2. Load conversation context
  const context = await contextMgr.loadContext(conversationId);
  const updatedContext = contextMgr.addMessage(context, { role: 'user', content: userMessage });

  // 3. Check if we need to summarize older context
  const summarizationPrompt = contextMgr.getSummarizationPrompt(updatedContext);
  if (summarizationPrompt) {
    try {
      const summaryResponse = await router.complete(summarizationPrompt, 'You are a concise summarizer.', { maxOutputTokens: 500 });
      const withSummary = contextMgr.applySummary(updatedContext, summaryResponse.content);
      Object.assign(updatedContext, withSummary);
    } catch { /* continue without summary */ }
  }

  // 4. Classify intent
  const intent = await classifyIntent(userMessage);

  // 5. Generate response and create tasks based on intent
  const { response, taskIds } = await handleIntent(intent, updatedContext, channel);

  // 6. Save updated context with assistant response
  const finalContext = contextMgr.addMessage(updatedContext, { role: 'model', content: response });
  await contextMgr.saveContext(finalContext);

  return { response, tasks: taskIds, intent };
}

/**
 * Classify user intent using AI
 */
async function classifyIntent(message: string): Promise<UserIntent> {
  try {
    const response = await router.complete(
      `User message: "${message}"\n\n${INTENT_CLASSIFICATION_PROMPT}`,
      'You are an intent classifier for a KRA tax filing service. Respond only with JSON.',
      { temperature: 0.1, maxOutputTokens: 300 }
    );

    const result = validator.parseAndValidate(response.content, 'intent');
    if (result.valid && result.sanitizedResponse) {
      return result.sanitizedResponse as UserIntent;
    }

    // Fallback parse
    const cleaned = response.content.replace(/```json\n?|```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      intent: 'unknown',
      service: null,
      entities: {},
      confidence: 0.3,
      requiresConfirmation: true,
    };
  }
}

/**
 * Handle classified intent — generate response and create tasks
 */
async function handleIntent(
  intent: UserIntent,
  context: contextMgr.ConversationContext,
  channel: string
): Promise<{ response: string; taskIds: string[] }> {
  const taskIds: string[] = [];

  switch (intent.intent) {
    case 'greeting': {
      const systemPrompt = channel === 'whatsapp'
        ? prompts.build('whatsapp-greeting', { userName: 'there', userPhone: '' })
        : prompts.build('orchestrator');
      const messages = contextMgr.buildContextMessages(context, systemPrompt);
      const aiResponse = await router.chat(messages);
      return { response: aiResponse.content, taskIds };
    }

    case 'file_nil_return_individual': {
      if (!intent.entities.pin) {
        return { response: "I'd be happy to help you file your nil returns! Please provide your KRA PIN to get started.", taskIds };
      }
      // Create filing task
      const task = await createTask({
        agentType: 'kra-filing',
        taskType: 'file_nil_return',
        inputData: { pin: intent.entities.pin, type: 'individual' },
        conversationId: context.conversationId,
        priority: 'high',
      });
      taskIds.push(task.id);
      return {
        response: `I'll file nil returns for PIN ${intent.entities.pin}. First, I'll need your KRA password. Please share it securely — it will only be used for this filing and won't be stored.`,
        taskIds,
      };
    }

    case 'file_nil_return_company': {
      if (!intent.entities.pin) {
        return { response: "I can help file company nil returns! Please provide the company KRA PIN (starts with P).", taskIds };
      }
      const task = await createTask({
        agentType: 'kra-filing',
        taskType: 'batch_file',
        inputData: { pin: intent.entities.pin, type: 'company', obligation_ids: intent.entities.obligation_ids || [] },
        conversationId: context.conversationId,
        priority: 'high',
      });
      taskIds.push(task.id);
      return {
        response: `I'll help file nil returns for company PIN ${intent.entities.pin}. Let me first check which obligations are registered. I'll need your KRA password to proceed.`,
        taskIds,
      };
    }

    case 'terminate_obligation': {
      if (!intent.entities.pin) {
        return { response: "To terminate a tax obligation, I'll need the company KRA PIN (starts with P). Please provide it.", taskIds };
      }
      const task = await createTask({
        agentType: 'kra-account',
        taskType: 'terminate_obligation',
        inputData: { pin: intent.entities.pin, obligation_ids: intent.entities.obligation_ids || [], reason: intent.entities.reason || '' },
        conversationId: context.conversationId,
        priority: 'medium',
      });
      taskIds.push(task.id);
      return {
        response: `I'll help you terminate obligations for PIN ${intent.entities.pin}. Which specific obligations would you like to terminate, and what's the reason? (e.g., Business Closed, Business Dormant)`,
        taskIds,
      };
    }

    case 'reset_password': {
      if (!intent.entities.pin) {
        return { response: "To reset your KRA password, please provide your KRA PIN.", taskIds };
      }
      const task = await createTask({
        agentType: 'kra-account',
        taskType: 'reset_password',
        inputData: { pin: intent.entities.pin },
        conversationId: context.conversationId,
        priority: 'high',
      });
      taskIds.push(task.id);
      return {
        response: `I'll initiate a password reset for PIN ${intent.entities.pin}. The reset link will be sent to the email registered with KRA. Processing now...`,
        taskIds,
      };
    }

    case 'change_email': {
      return {
        response: "To change your KRA email, you'll need to visit a KRA office with your ID and KRA PIN certificate. I can help you find the nearest KRA office or guide you through the process. Would you like that?",
        taskIds,
      };
    }

    case 'check_obligations': {
      if (!intent.entities.pin) {
        return { response: "Please provide the company KRA PIN (starts with P) to check its obligations.", taskIds };
      }
      const task = await createTask({
        agentType: 'kra-pin',
        taskType: 'check_obligations',
        inputData: { pin: intent.entities.pin },
        conversationId: context.conversationId,
        priority: 'medium',
      });
      taskIds.push(task.id);
      return {
        response: `Checking obligations for PIN ${intent.entities.pin}...`,
        taskIds,
      };
    }

    case 'check_status': {
      const tasks = await getTasksByConversation(context.conversationId);
      const activeTasks = tasks.filter(t => !['completed', 'failed', 'dead_letter'].includes(t.status));
      if (activeTasks.length === 0) {
        return { response: "You don't have any active tasks. How can I help you today?", taskIds };
      }
      const statusLines = activeTasks.map(t => `• ${t.taskType}: ${t.status}`).join('\n');
      return { response: `Here are your active tasks:\n${statusLines}`, taskIds };
    }

    case 'get_support': {
      const task = await createTask({
        agentType: 'ticketing',
        taskType: 'create_ticket',
        inputData: { description: context.messages.slice(-3).map(m => m.content).join('\n'), channel },
        conversationId: context.conversationId,
        priority: 'medium',
      });
      taskIds.push(task.id);
      return {
        response: "I'm sorry you're having trouble. I've created a support ticket for you. A member of our team will look into this. Could you describe the issue in more detail so we can resolve it faster?",
        taskIds,
      };
    }

    default: {
      // Use AI to generate a helpful response
      const systemPrompt = prompts.build('orchestrator');
      const messages = contextMgr.buildContextMessages(context, systemPrompt);
      const aiResponse = await router.chat(messages);
      return { response: aiResponse.content, taskIds };
    }
  }
}

/**
 * Get orchestrator status
 */
export function getStatus(): { healthy: boolean } {
  return { healthy: true };
}
