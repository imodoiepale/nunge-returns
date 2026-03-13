// lib/agents/sub-agents/security-agent.ts
// Monitor anomalies, prompt injection attempts, API abuse

import { startTask, completeTask, failTask, type Task } from '../task-manager';
import { heartbeat, recordExecution } from '../agent-registry';
import { getRecentEvents, getThreatSummary } from '../../security/audit-logger';
import { getRateLimiter } from '../../security/rate-limiter';

const AGENT_TYPE = 'security' as const;

export async function execute(task: Task): Promise<void> {
  heartbeat(AGENT_TYPE);
  await startTask(task.id);

  try {
    let result: Record<string, any>;

    switch (task.taskType) {
      case 'analyze_threat':
        result = await analyzeThreat(task.inputData);
        break;
      case 'block_ip':
        result = await blockIp(task.inputData);
        break;
      case 'review_audit_log':
        result = await reviewAuditLog(task.inputData);
        break;
      default:
        throw new Error(`Unknown task type: ${task.taskType}`);
    }

    await completeTask(task.id, result);
    recordExecution(AGENT_TYPE, true);
  } catch (error: any) {
    recordExecution(AGENT_TYPE, false);
    await failTask(task.id, error.message);
  }
}

async function analyzeThreat(input: Record<string, any>): Promise<Record<string, any>> {
  const { hours } = input;
  const summary = await getThreatSummary(hours || 24);
  const totalEvents = Object.values(summary).reduce((a, b) => a + b, 0);

  let threatLevel = 'low';
  if (totalEvents > 100 || summary.prompt_injection > 10 || summary.brute_force > 5) {
    threatLevel = 'critical';
  } else if (totalEvents > 50 || summary.rate_limit_exceeded > 20) {
    threatLevel = 'high';
  } else if (totalEvents > 20) {
    threatLevel = 'medium';
  }

  const rateLimiter = getRateLimiter();
  const rateLimitStats = rateLimiter.getStats();

  return {
    success: true,
    threatLevel,
    totalEvents,
    summary,
    rateLimitStats,
    recommendations: generateRecommendations(summary, threatLevel),
  };
}

function generateRecommendations(summary: Record<string, number>, threatLevel: string): string[] {
  const recs: string[] = [];

  if (summary.prompt_injection > 5) {
    recs.push('Multiple prompt injection attempts detected. Consider strengthening input validation.');
  }
  if (summary.brute_force > 3) {
    recs.push('Brute force attempts detected. Consider implementing account lockout.');
  }
  if (summary.rate_limit_exceeded > 30) {
    recs.push('High rate limit violations. Consider tightening rate limits or blocking repeat offenders.');
  }
  if (summary.auth_failure > 10) {
    recs.push('Multiple auth failures. Review for credential stuffing attacks.');
  }
  if (threatLevel === 'critical') {
    recs.push('CRITICAL: Consider enabling enhanced monitoring and alerting.');
  }

  if (recs.length === 0) {
    recs.push('No immediate action required. System security is nominal.');
  }

  return recs;
}

async function blockIp(input: Record<string, any>): Promise<Record<string, any>> {
  const { ip, duration_minutes, reason } = input;
  if (!ip) return { success: false, error: 'IP address required' };

  const rateLimiter = getRateLimiter();
  const durationMs = (duration_minutes || 60) * 60 * 1000;
  rateLimiter.block(ip, 'api', durationMs);

  return {
    success: true,
    ip,
    blockedUntil: new Date(Date.now() + durationMs).toISOString(),
    reason: reason || 'Manual block by security agent',
    message: `IP ${ip} blocked for ${duration_minutes || 60} minutes.`,
  };
}

async function reviewAuditLog(input: Record<string, any>): Promise<Record<string, any>> {
  const { limit, severity, event_type } = input;
  const events = await getRecentEvents(limit || 50, severity, event_type);

  return {
    success: true,
    eventCount: events.length,
    events: events.map(e => ({
      type: e.event_type,
      severity: e.severity,
      ip: e.source_ip,
      endpoint: e.endpoint,
      details: e.details,
      blocked: e.blocked,
      timestamp: e.created_at,
    })),
  };
}
