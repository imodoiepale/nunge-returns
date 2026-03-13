// lib/agents/sub-agents/ticketing-agent.ts
// Support ticket creation, updates, escalation, resolution

import { startTask, completeTask, failTask, type Task } from '../task-manager';
import { heartbeat, recordExecution } from '../agent-registry';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

const AGENT_TYPE = 'ticketing' as const;

const SLA_TARGETS: Record<string, { responseMinutes: number; resolutionMinutes: number }> = {
  critical: { responseMinutes: 15, resolutionMinutes: 60 },
  high: { responseMinutes: 30, resolutionMinutes: 240 },
  medium: { responseMinutes: 120, resolutionMinutes: 1440 },
  low: { responseMinutes: 480, resolutionMinutes: 4320 },
};

export async function execute(task: Task): Promise<void> {
  heartbeat(AGENT_TYPE);
  await startTask(task.id);

  try {
    let result: Record<string, any>;

    switch (task.taskType) {
      case 'create_ticket':
        result = await createTicket(task.inputData, task.conversationId);
        break;
      case 'update_ticket':
        result = await updateTicket(task.inputData);
        break;
      case 'escalate_ticket':
        result = await escalateTicket(task.inputData);
        break;
      case 'resolve_ticket':
        result = await resolveTicket(task.inputData);
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

async function createTicket(input: Record<string, any>, conversationId?: string): Promise<Record<string, any>> {
  const { subject, description, category, priority, requester_name, requester_email, requester_phone, channel } = input;

  const ticketPriority = priority || 'medium';
  const sla = SLA_TARGETS[ticketPriority] || SLA_TARGETS.medium;
  const now = new Date();

  const { data, error } = await supabase
    .from('tickets')
    .insert({
      conversation_id: conversationId || null,
      category: category || 'general',
      priority: ticketPriority,
      status: 'open',
      subject: subject || 'Support request',
      description: description || '',
      requester_name: requester_name || null,
      requester_email: requester_email || null,
      requester_phone: requester_phone || null,
      assigned_to: 'ticketing-agent',
      escalation_level: 0,
      sla_response_deadline: new Date(now.getTime() + sla.responseMinutes * 60000).toISOString(),
      sla_resolution_deadline: new Date(now.getTime() + sla.resolutionMinutes * 60000).toISOString(),
      tags: channel ? [channel] : [],
      metadata: { source: channel || 'system' },
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create ticket: ${error.message}`);

  // Add initial message
  await supabase.from('ticket_messages').insert({
    id: uuidv4(),
    ticket_id: data.id,
    sender_type: 'system',
    sender_name: 'JARVIS',
    message: `Ticket created. ${description || 'No description provided.'}`,
    is_internal: false,
  });

  return {
    success: true,
    ticketId: data.id,
    ticketNumber: data.ticket_number,
    priority: ticketPriority,
    slaResponse: sla.responseMinutes,
    slaResolution: sla.resolutionMinutes,
    message: `Support ticket ${data.ticket_number} created. We'll respond within ${sla.responseMinutes} minutes.`,
  };
}

async function updateTicket(input: Record<string, any>): Promise<Record<string, any>> {
  const { ticket_id, ticket_number, status, message, is_internal } = input;

  const identifier = ticket_id || ticket_number;
  if (!identifier) return { success: false, error: 'Ticket ID or number required' };

  const query = ticket_id
    ? supabase.from('tickets').select('*').eq('id', ticket_id).single()
    : supabase.from('tickets').select('*').eq('ticket_number', ticket_number).single();

  const { data: ticket, error } = await query;
  if (error || !ticket) return { success: false, error: 'Ticket not found' };

  // Update status if provided
  if (status) {
    const update: any = { status };
    if (status === 'in_progress' && !ticket.first_response_at) {
      update.first_response_at = new Date().toISOString();
    }
    await supabase.from('tickets').update(update).eq('id', ticket.id);
  }

  // Add message if provided
  if (message) {
    await supabase.from('ticket_messages').insert({
      id: uuidv4(),
      ticket_id: ticket.id,
      sender_type: 'ai_agent',
      sender_name: 'JARVIS',
      message,
      is_internal: is_internal || false,
    });
  }

  return { success: true, ticketId: ticket.id, ticketNumber: ticket.ticket_number, status: status || ticket.status };
}

async function escalateTicket(input: Record<string, any>): Promise<Record<string, any>> {
  const { ticket_id, reason } = input;
  if (!ticket_id) return { success: false, error: 'Ticket ID required' };

  const { data: ticket } = await supabase.from('tickets').select('*').eq('id', ticket_id).single();
  if (!ticket) return { success: false, error: 'Ticket not found' };

  const newLevel = Math.min((ticket.escalation_level || 0) + 1, 3);
  const assignedTo = newLevel >= 2 ? 'human_agent' : 'senior_ai_agent';

  await supabase.from('tickets').update({
    escalation_level: newLevel,
    assigned_to: assignedTo,
    status: 'escalated',
    priority: newLevel >= 2 ? 'high' : ticket.priority,
  }).eq('id', ticket_id);

  await supabase.from('ticket_messages').insert({
    id: uuidv4(),
    ticket_id,
    sender_type: 'system',
    sender_name: 'JARVIS',
    message: `Ticket escalated to level ${newLevel}. Reason: ${reason || 'Not specified'}`,
    is_internal: true,
  });

  return {
    success: true,
    ticketNumber: ticket.ticket_number,
    escalationLevel: newLevel,
    assignedTo,
    message: newLevel >= 2
      ? 'Ticket escalated to a human agent. They will respond shortly.'
      : 'Ticket escalated for priority handling.',
  };
}

async function resolveTicket(input: Record<string, any>): Promise<Record<string, any>> {
  const { ticket_id, resolution_notes } = input;
  if (!ticket_id) return { success: false, error: 'Ticket ID required' };

  await supabase.from('tickets').update({
    status: 'resolved',
    resolved_at: new Date().toISOString(),
    resolution_notes: resolution_notes || 'Resolved by JARVIS',
  }).eq('id', ticket_id);

  await supabase.from('ticket_messages').insert({
    id: uuidv4(),
    ticket_id,
    sender_type: 'ai_agent',
    sender_name: 'JARVIS',
    message: `Ticket resolved. ${resolution_notes || ''}`,
    is_internal: false,
  });

  return { success: true, message: 'Ticket resolved successfully.' };
}
