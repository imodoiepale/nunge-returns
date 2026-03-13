// lib/autonomous/bug-detector.ts
// Monitor error logs, classify errors, auto-create tickets for persistent issues

import { supabase } from '@/lib/supabaseClient';
import { createTask } from '../agents/task-manager';
import { v4 as uuidv4 } from 'uuid';

interface ErrorPattern {
  message: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  component: string;
  isTransient: boolean;
}

/**
 * Scan for persistent errors and auto-create bug tickets
 */
export async function scanForBugs(): Promise<{ detected: number; ticketsCreated: number }> {
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // last hour

  // Check task failures
  const { data: failedTasks } = await supabase
    .from('ai_tasks')
    .select('agent_type, task_type, error_message, created_at')
    .eq('status', 'dead_letter')
    .gte('created_at', since);

  // Check security events
  const { data: securityEvents } = await supabase
    .from('security_events')
    .select('event_type, severity, details, created_at')
    .in('severity', ['critical', 'high'])
    .gte('created_at', since);

  // Check system health failures
  const { data: healthFailures } = await supabase
    .from('system_health_logs')
    .select('component, status, error_message, checked_at')
    .eq('status', 'down')
    .gte('checked_at', since);

  // Aggregate error patterns
  const patterns: Map<string, ErrorPattern> = new Map();

  for (const task of (failedTasks || [])) {
    const key = `task:${task.agent_type}:${task.error_message?.substring(0, 50)}`;
    const existing = patterns.get(key);
    if (existing) {
      existing.count++;
      existing.lastSeen = task.created_at;
    } else {
      patterns.set(key, {
        message: task.error_message || 'Unknown error',
        count: 1,
        firstSeen: task.created_at,
        lastSeen: task.created_at,
        component: `agent:${task.agent_type}`,
        isTransient: false,
      });
    }
  }

  for (const health of (healthFailures || [])) {
    const key = `health:${health.component}`;
    const existing = patterns.get(key);
    if (existing) {
      existing.count++;
      existing.lastSeen = health.checked_at;
    } else {
      patterns.set(key, {
        message: health.error_message || `${health.component} is down`,
        count: 1,
        firstSeen: health.checked_at,
        lastSeen: health.checked_at,
        component: health.component,
        isTransient: true, // health issues may be transient
      });
    }
  }

  // Classify: persistent = 3+ occurrences in the last hour
  let detected = 0;
  let ticketsCreated = 0;

  for (const [key, pattern] of patterns.entries()) {
    detected++;

    if (pattern.count >= 3 && !pattern.isTransient) {
      // Check if a ticket already exists for this pattern
      const { data: existingTicket } = await supabase
        .from('tickets')
        .select('id')
        .eq('category', 'bug')
        .ilike('subject', `%${pattern.component}%`)
        .not('status', 'in', '("resolved","closed")')
        .limit(1)
        .single();

      if (!existingTicket) {
        // Create a bug ticket
        await createTask({
          agentType: 'ticketing',
          taskType: 'create_ticket',
          inputData: {
            subject: `[AUTO] Bug detected in ${pattern.component}`,
            description: `Automated bug detection found ${pattern.count} occurrences of the following error:\n\n${pattern.message}\n\nFirst seen: ${pattern.firstSeen}\nLast seen: ${pattern.lastSeen}\nComponent: ${pattern.component}`,
            category: 'bug',
            priority: pattern.count >= 10 ? 'critical' : pattern.count >= 5 ? 'high' : 'medium',
            channel: 'system',
          },
          priority: 'medium',
        });
        ticketsCreated++;
        console.log(`[BUG-DETECTOR] Created ticket for ${pattern.component}: ${pattern.message.substring(0, 80)}`);
      }
    }
  }

  if (detected > 0) {
    console.log(`[BUG-DETECTOR] Scan complete: ${detected} patterns detected, ${ticketsCreated} tickets created`);
  }

  return { detected, ticketsCreated };
}

/**
 * Get error summary for the control center
 */
export async function getErrorSummary(hours: number = 24): Promise<{
  totalErrors: number;
  byComponent: Record<string, number>;
  byType: Record<string, number>;
  persistent: string[];
}> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data: tasks } = await supabase
    .from('ai_tasks')
    .select('agent_type, error_message')
    .in('status', ['failed', 'dead_letter'])
    .gte('created_at', since);

  const byComponent: Record<string, number> = {};
  const byType: Record<string, number> = {};
  const errorCounts: Record<string, number> = {};

  for (const task of (tasks || [])) {
    byComponent[task.agent_type] = (byComponent[task.agent_type] || 0) + 1;
    const errorKey = task.error_message?.substring(0, 60) || 'unknown';
    byType[errorKey] = (byType[errorKey] || 0) + 1;
    errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1;
  }

  const persistent = Object.entries(errorCounts)
    .filter(([, count]) => count >= 3)
    .map(([msg]) => msg);

  return {
    totalErrors: (tasks || []).length,
    byComponent,
    byType,
    persistent,
  };
}
