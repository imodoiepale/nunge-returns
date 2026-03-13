// mcp-servers/ticketing-mcp/index.ts
// Ticketing MCP Server — create, update, escalate, resolve support tickets

import { registerServer } from '@/lib/mcp/client';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function registerTicketingMcp(): void {
  registerServer({
    name: 'ticketing-mcp',
    description: 'Support ticketing tools — create, update, escalate, resolve tickets with SLA tracking',
    baseUrl: `${BASE_URL}/api/mcp/ticketing`,
    tools: [
      {
        name: 'create_ticket',
        description: 'Create a new support ticket with category, priority, and SLA deadlines',
        inputSchema: {
          type: 'object',
          properties: {
            subject: { type: 'string', description: 'Ticket subject/title' },
            description: { type: 'string', description: 'Detailed description of the issue' },
            category: { type: 'string', description: 'Ticket category', enum: ['billing', 'technical', 'service', 'account', 'general', 'bug', 'feature_request'] },
            priority: { type: 'string', description: 'Ticket priority', enum: ['critical', 'high', 'medium', 'low'] },
            requester_name: { type: 'string', description: 'Name of the requester' },
            requester_email: { type: 'string', description: 'Email of the requester' },
            requester_phone: { type: 'string', description: 'Phone number of the requester' },
          },
          required: ['subject'],
        },
      },
      {
        name: 'update_ticket',
        description: 'Update an existing ticket status or add a message',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: { type: 'string', description: 'Ticket UUID' },
            ticket_number: { type: 'string', description: 'Ticket number (TKT-XXXXXX)' },
            status: { type: 'string', description: 'New status', enum: ['open', 'in_progress', 'waiting_customer', 'waiting_agent', 'escalated', 'resolved', 'closed'] },
            message: { type: 'string', description: 'Message to add to the ticket thread' },
            is_internal: { type: 'boolean', description: 'Whether the message is internal (not visible to customer)' },
          },
        },
      },
      {
        name: 'escalate_ticket',
        description: 'Escalate a ticket to a higher support level (AI -> Senior AI -> Human -> Admin)',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: { type: 'string', description: 'Ticket UUID' },
            reason: { type: 'string', description: 'Reason for escalation' },
          },
          required: ['ticket_id'],
        },
      },
      {
        name: 'resolve_ticket',
        description: 'Mark a ticket as resolved with resolution notes',
        inputSchema: {
          type: 'object',
          properties: {
            ticket_id: { type: 'string', description: 'Ticket UUID' },
            resolution_notes: { type: 'string', description: 'How the issue was resolved' },
          },
          required: ['ticket_id'],
        },
      },
      {
        name: 'list_tickets',
        description: 'List tickets filtered by status, priority, or requester',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'Filter by status' },
            priority: { type: 'string', description: 'Filter by priority' },
            requester_phone: { type: 'string', description: 'Filter by requester phone' },
            limit: { type: 'number', description: 'Max results (default 20)' },
          },
        },
      },
    ],
    resources: [
      {
        uri: 'ticketing://categories',
        name: 'Ticket Categories',
        description: 'Available ticket categories and their descriptions',
        mimeType: 'application/json',
      },
      {
        uri: 'ticketing://sla-definitions',
        name: 'SLA Definitions',
        description: 'Response and resolution time targets per priority level',
        mimeType: 'application/json',
      },
    ],
  });
}

export const SLA_DEFINITIONS = {
  critical: { responseMinutes: 15, resolutionMinutes: 60, description: '15 min response, 1 hour resolution' },
  high: { responseMinutes: 30, resolutionMinutes: 240, description: '30 min response, 4 hour resolution' },
  medium: { responseMinutes: 120, resolutionMinutes: 1440, description: '2 hour response, 24 hour resolution' },
  low: { responseMinutes: 480, resolutionMinutes: 4320, description: '8 hour response, 72 hour resolution' },
};
