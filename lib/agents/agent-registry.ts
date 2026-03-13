// lib/agents/agent-registry.ts
// Register/discover agents by capability, track health, load balance

import type { AgentType } from './task-manager';

export interface AgentCapability {
  taskType: string;
  description: string;
}

export interface AgentRegistration {
  agentType: AgentType;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  status: 'active' | 'degraded' | 'offline';
  lastHeartbeat: number;
  totalExecutions: number;
  successRate: number;
}

const registry: Map<AgentType, AgentRegistration> = new Map();

/**
 * Register an agent with its capabilities
 */
export function registerAgent(registration: Omit<AgentRegistration, 'status' | 'lastHeartbeat' | 'totalExecutions' | 'successRate'>): void {
  registry.set(registration.agentType, {
    ...registration,
    status: 'active',
    lastHeartbeat: Date.now(),
    totalExecutions: 0,
    successRate: 100,
  });
}

/**
 * Get an agent by type
 */
export function getAgent(agentType: AgentType): AgentRegistration | undefined {
  return registry.get(agentType);
}

/**
 * Find agents that can handle a specific task type
 */
export function findAgentsForTask(taskType: string): AgentRegistration[] {
  const results: AgentRegistration[] = [];
  for (const agent of registry.values()) {
    if (agent.status !== 'offline' && agent.capabilities.some(c => c.taskType === taskType)) {
      results.push(agent);
    }
  }
  // Sort by success rate (best first), then by status (active before degraded)
  return results.sort((a, b) => {
    if (a.status === 'active' && b.status !== 'active') return -1;
    if (b.status === 'active' && a.status !== 'active') return 1;
    return b.successRate - a.successRate;
  });
}

/**
 * Record a heartbeat for an agent
 */
export function heartbeat(agentType: AgentType): void {
  const agent = registry.get(agentType);
  if (agent) {
    agent.lastHeartbeat = Date.now();
    if (agent.status === 'offline') agent.status = 'active';
  }
}

/**
 * Record execution result
 */
export function recordExecution(agentType: AgentType, success: boolean): void {
  const agent = registry.get(agentType);
  if (!agent) return;

  agent.totalExecutions++;
  // Exponential moving average for success rate
  const alpha = 0.1;
  agent.successRate = agent.successRate * (1 - alpha) + (success ? 100 : 0) * alpha;

  if (agent.successRate < 50) {
    agent.status = 'degraded';
  } else {
    agent.status = 'active';
  }
}

/**
 * Mark agent as offline
 */
export function markOffline(agentType: AgentType): void {
  const agent = registry.get(agentType);
  if (agent) agent.status = 'offline';
}

/**
 * Get all registered agents with their status
 */
export function getAllAgents(): AgentRegistration[] {
  // Check for stale heartbeats (> 5 min)
  const staleThreshold = 5 * 60 * 1000;
  const now = Date.now();
  for (const agent of registry.values()) {
    if (now - agent.lastHeartbeat > staleThreshold && agent.status === 'active') {
      agent.status = 'degraded';
    }
  }
  return Array.from(registry.values());
}

/**
 * Get health summary
 */
export function getHealthSummary(): { total: number; active: number; degraded: number; offline: number } {
  let active = 0, degraded = 0, offline = 0;
  for (const agent of registry.values()) {
    if (agent.status === 'active') active++;
    else if (agent.status === 'degraded') degraded++;
    else offline++;
  }
  return { total: registry.size, active, degraded, offline };
}

// --- Register all default agents ---

export function registerDefaultAgents(): void {
  registerAgent({
    agentType: 'orchestrator',
    name: 'JARVIS Orchestrator',
    description: 'Central brain — decomposes user intent into tasks and delegates to sub-agents',
    capabilities: [
      { taskType: 'classify_intent', description: 'Classify user message intent' },
      { taskType: 'decompose_request', description: 'Break complex request into sub-tasks' },
      { taskType: 'generate_response', description: 'Generate final user-facing response' },
    ],
  });

  registerAgent({
    agentType: 'kra-filing',
    name: 'KRA Filing Agent',
    description: 'Files nil returns for individuals and companies',
    capabilities: [
      { taskType: 'file_nil_return', description: 'File individual nil return' },
      { taskType: 'batch_file', description: 'Batch file company nil returns' },
      { taskType: 'check_filing_status', description: 'Check status of a filing' },
    ],
  });

  registerAgent({
    agentType: 'kra-pin',
    name: 'KRA PIN Agent',
    description: 'PIN registration, validation, and retrieval',
    capabilities: [
      { taskType: 'validate_pin', description: 'Validate a KRA PIN' },
      { taskType: 'get_taxpayer_details', description: 'Fetch taxpayer details by PIN' },
      { taskType: 'check_obligations', description: 'Check company obligations' },
    ],
  });

  registerAgent({
    agentType: 'kra-account',
    name: 'KRA Account Agent',
    description: 'Password reset, email change, obligation termination',
    capabilities: [
      { taskType: 'reset_password', description: 'Reset KRA password' },
      { taskType: 'change_email', description: 'Change KRA email' },
      { taskType: 'terminate_obligation', description: 'Terminate a tax obligation' },
      { taskType: 'validate_password', description: 'Validate KRA password' },
    ],
  });

  registerAgent({
    agentType: 'payment',
    name: 'Payment Agent',
    description: 'M-Pesa payment processing',
    capabilities: [
      { taskType: 'initiate_payment', description: 'Initiate M-Pesa STK push' },
      { taskType: 'check_payment', description: 'Check payment status' },
      { taskType: 'process_refund', description: 'Process a refund' },
    ],
  });

  registerAgent({
    agentType: 'ticketing',
    name: 'Ticketing Agent',
    description: 'Support ticket management',
    capabilities: [
      { taskType: 'create_ticket', description: 'Create support ticket' },
      { taskType: 'update_ticket', description: 'Update ticket status' },
      { taskType: 'escalate_ticket', description: 'Escalate ticket' },
      { taskType: 'resolve_ticket', description: 'Resolve ticket' },
    ],
  });

  registerAgent({
    agentType: 'security',
    name: 'Security Agent',
    description: 'Monitor anomalies, prompt injection, API abuse',
    capabilities: [
      { taskType: 'analyze_threat', description: 'Analyze a security threat' },
      { taskType: 'block_ip', description: 'Block a suspicious IP' },
      { taskType: 'review_audit_log', description: 'Review security audit log' },
    ],
  });

  registerAgent({
    agentType: 'nssf',
    name: 'NSSF Agent',
    description: 'NSSF registration assistance',
    capabilities: [
      { taskType: 'register_nssf', description: 'Assist with NSSF registration' },
    ],
  });

  registerAgent({
    agentType: 'shif',
    name: 'SHIF Agent',
    description: 'SHIF registration assistance',
    capabilities: [
      { taskType: 'register_shif', description: 'Assist with SHIF registration' },
    ],
  });
}
