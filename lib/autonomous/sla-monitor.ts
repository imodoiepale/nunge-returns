// lib/autonomous/sla-monitor.ts
// Track ticket response/resolution times, auto-escalate SLA breaches

import { supabase } from '@/lib/supabaseClient';
import { createTask } from '../agents/task-manager';

interface SlaBreachInfo {
  ticketId: string;
  ticketNumber: string;
  breachType: 'response' | 'resolution';
  priority: string;
  deadline: string;
  overdueMinutes: number;
}

/**
 * Check SLA compliance for all open tickets
 */
export async function checkSlaCompliance(): Promise<{ breaches: SlaBreachInfo[]; escalated: number }> {
  const now = new Date();
  const breaches: SlaBreachInfo[] = [];
  let escalated = 0;

  // Find tickets that have breached response SLA
  const { data: responseBreaches } = await supabase
    .from('tickets')
    .select('id, ticket_number, priority, sla_response_deadline, first_response_at, escalation_level')
    .in('status', ['open'])
    .is('first_response_at', null)
    .lt('sla_response_deadline', now.toISOString());

  for (const ticket of (responseBreaches || [])) {
    const deadline = new Date(ticket.sla_response_deadline);
    const overdueMinutes = Math.round((now.getTime() - deadline.getTime()) / 60000);

    breaches.push({
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      breachType: 'response',
      priority: ticket.priority,
      deadline: ticket.sla_response_deadline,
      overdueMinutes,
    });

    // Auto-escalate if overdue by more than 2x the SLA
    if (overdueMinutes > getSlaMinutes(ticket.priority, 'response') && ticket.escalation_level < 2) {
      await createTask({
        agentType: 'ticketing',
        taskType: 'escalate_ticket',
        inputData: {
          ticket_id: ticket.id,
          reason: `SLA response breach: ${overdueMinutes} minutes overdue (${ticket.priority} priority)`,
        },
        priority: 'high',
      });
      escalated++;
    }
  }

  // Find tickets that have breached resolution SLA
  const { data: resolutionBreaches } = await supabase
    .from('tickets')
    .select('id, ticket_number, priority, sla_resolution_deadline, escalation_level')
    .in('status', ['open', 'in_progress', 'waiting_agent', 'escalated'])
    .lt('sla_resolution_deadline', now.toISOString());

  for (const ticket of (resolutionBreaches || [])) {
    const deadline = new Date(ticket.sla_resolution_deadline);
    const overdueMinutes = Math.round((now.getTime() - deadline.getTime()) / 60000);

    breaches.push({
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      breachType: 'resolution',
      priority: ticket.priority,
      deadline: ticket.sla_resolution_deadline,
      overdueMinutes,
    });

    // Auto-escalate resolution breaches
    if (ticket.escalation_level < 3) {
      await createTask({
        agentType: 'ticketing',
        taskType: 'escalate_ticket',
        inputData: {
          ticket_id: ticket.id,
          reason: `SLA resolution breach: ${overdueMinutes} minutes overdue (${ticket.priority} priority)`,
        },
        priority: ticket.priority === 'critical' ? 'critical' : 'high',
      });
      escalated++;
    }
  }

  if (breaches.length > 0) {
    console.log(`[SLA-MONITOR] ${breaches.length} SLA breaches detected, ${escalated} tickets escalated`);
  }

  return { breaches, escalated };
}

/**
 * Get SLA compliance report for the dashboard
 */
export async function getSlaReport(hours: number = 24): Promise<{
  totalTickets: number;
  withinSla: number;
  breached: number;
  complianceRate: number;
  avgResponseMinutes: number;
  avgResolutionMinutes: number;
}> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data: tickets } = await supabase
    .from('tickets')
    .select('priority, status, first_response_at, resolved_at, sla_response_deadline, sla_resolution_deadline, created_at')
    .gte('created_at', since);

  if (!tickets || tickets.length === 0) {
    return { totalTickets: 0, withinSla: 0, breached: 0, complianceRate: 100, avgResponseMinutes: 0, avgResolutionMinutes: 0 };
  }

  let withinSla = 0;
  let breached = 0;
  let totalResponseMinutes = 0;
  let totalResolutionMinutes = 0;
  let responseCount = 0;
  let resolutionCount = 0;

  for (const ticket of tickets) {
    let ticketBreached = false;

    // Check response SLA
    if (ticket.first_response_at && ticket.sla_response_deadline) {
      const responseTime = new Date(ticket.first_response_at).getTime() - new Date(ticket.created_at).getTime();
      totalResponseMinutes += responseTime / 60000;
      responseCount++;

      if (new Date(ticket.first_response_at) > new Date(ticket.sla_response_deadline)) {
        ticketBreached = true;
      }
    } else if (ticket.sla_response_deadline && new Date(ticket.sla_response_deadline) < new Date()) {
      ticketBreached = true;
    }

    // Check resolution SLA
    if (ticket.resolved_at && ticket.sla_resolution_deadline) {
      const resolutionTime = new Date(ticket.resolved_at).getTime() - new Date(ticket.created_at).getTime();
      totalResolutionMinutes += resolutionTime / 60000;
      resolutionCount++;

      if (new Date(ticket.resolved_at) > new Date(ticket.sla_resolution_deadline)) {
        ticketBreached = true;
      }
    }

    if (ticketBreached) breached++;
    else withinSla++;
  }

  return {
    totalTickets: tickets.length,
    withinSla,
    breached,
    complianceRate: tickets.length > 0 ? Math.round((withinSla / tickets.length) * 100) : 100,
    avgResponseMinutes: responseCount > 0 ? Math.round(totalResponseMinutes / responseCount) : 0,
    avgResolutionMinutes: resolutionCount > 0 ? Math.round(totalResolutionMinutes / resolutionCount) : 0,
  };
}

function getSlaMinutes(priority: string, type: 'response' | 'resolution'): number {
  const sla: Record<string, Record<string, number>> = {
    critical: { response: 15, resolution: 60 },
    high: { response: 30, resolution: 240 },
    medium: { response: 120, resolution: 1440 },
    low: { response: 480, resolution: 4320 },
  };
  return sla[priority]?.[type] || sla.medium[type];
}
