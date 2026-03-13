// lib/agents/index.ts
// Central export and agent executor for the JARVIS agent system

import { registerDefaultAgents, findAgentsForTask, getAgent, getAllAgents, getHealthSummary } from './agent-registry';
import { getNextTask, assignTask, type Task, type AgentType } from './task-manager';

import * as kraFilingAgent from './sub-agents/kra-filing-agent';
import * as kraPinAgent from './sub-agents/kra-pin-agent';
import * as kraAccountAgent from './sub-agents/kra-account-agent';
import * as paymentAgent from './sub-agents/payment-agent';
import * as ticketingAgent from './sub-agents/ticketing-agent';
import * as securityAgent from './sub-agents/security-agent';
import * as nssfAgent from './sub-agents/nssf-agent';
import * as shifAgent from './sub-agents/shif-agent';

// Map agent types to their execute functions
const AGENT_EXECUTORS: Record<string, (task: Task) => Promise<void>> = {
  'kra-filing': kraFilingAgent.execute,
  'kra-pin': kraPinAgent.execute,
  'kra-account': kraAccountAgent.execute,
  'payment': paymentAgent.execute,
  'ticketing': ticketingAgent.execute,
  'security': securityAgent.execute,
  'nssf': nssfAgent.execute,
  'shif': shifAgent.execute,
};

let initialized = false;

/**
 * Initialize the agent system — register all agents
 */
export function initialize(): void {
  if (initialized) return;
  registerDefaultAgents();
  initialized = true;
  console.log('[AGENTS] Agent system initialized with', getAllAgents().length, 'agents');
}

/**
 * Execute a specific task by routing to the appropriate agent
 */
export async function executeTask(task: Task): Promise<void> {
  initialize();

  const executor = AGENT_EXECUTORS[task.agentType];
  if (!executor) {
    throw new Error(`No executor found for agent type: ${task.agentType}`);
  }

  await assignTask(task.id);
  await executor(task);
}

/**
 * Process the next available task for a given agent type
 */
export async function processNextTask(agentType: AgentType): Promise<boolean> {
  initialize();

  const task = await getNextTask(agentType);
  if (!task) return false;

  await executeTask(task);
  return true;
}

/**
 * Poll and process tasks for all agent types (call from cron/scheduler)
 */
export async function processAllQueues(): Promise<{ processed: number; errors: number }> {
  initialize();

  const agentTypes: AgentType[] = ['kra-filing', 'kra-pin', 'kra-account', 'payment', 'ticketing', 'security', 'nssf', 'shif'];
  let processed = 0;
  let errors = 0;

  for (const agentType of agentTypes) {
    try {
      const didProcess = await processNextTask(agentType);
      if (didProcess) processed++;
    } catch (error: any) {
      console.error(`[AGENTS] Error processing ${agentType} queue:`, error.message);
      errors++;
    }
  }

  return { processed, errors };
}

// Re-exports
export { processMessage } from './orchestrator';
export { createTask, getTask, getTasksByConversation, getQueueStats } from './task-manager';
export { getAllAgents, getHealthSummary, findAgentsForTask } from './agent-registry';
export type { Task, AgentType, TaskStatus, TaskPriority } from './task-manager';
