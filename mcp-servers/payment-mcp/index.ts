// mcp-servers/payment-mcp/index.ts
// Payment MCP Server — M-Pesa STK push, payment verification, receipts, refunds

import { registerServer } from '@/lib/mcp/client';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function registerPaymentMcp(): void {
  registerServer({
    name: 'payment-mcp',
    description: 'Payment processing tools — M-Pesa STK push, payment verification, receipt generation, refunds',
    baseUrl: `${BASE_URL}/api/mcp/payment`,
    tools: [
      {
        name: 'initiate_mpesa_stk',
        description: 'Send an M-Pesa STK push payment request to a phone number',
        inputSchema: {
          type: 'object',
          properties: {
            phone: { type: 'string', description: 'M-Pesa phone number (0712345678 or +254712345678)' },
            amount: { type: 'number', description: 'Amount in KES' },
            description: { type: 'string', description: 'Payment description' },
            reference: { type: 'string', description: 'Payment reference ID' },
          },
          required: ['phone', 'amount'],
        },
      },
      {
        name: 'check_payment_status',
        description: 'Check the status of a payment by transaction ID or phone number',
        inputSchema: {
          type: 'object',
          properties: {
            transaction_id: { type: 'string', description: 'Transaction ID from database' },
            checkout_request_id: { type: 'string', description: 'M-Pesa checkout request ID' },
            phone: { type: 'string', description: 'Phone number to look up latest payment' },
          },
        },
      },
      {
        name: 'generate_receipt',
        description: 'Generate a payment receipt for a completed transaction',
        inputSchema: {
          type: 'object',
          properties: {
            transaction_id: { type: 'string', description: 'Transaction ID' },
            format: { type: 'string', description: 'Receipt format', enum: ['pdf', 'text'] },
          },
          required: ['transaction_id'],
        },
      },
      {
        name: 'process_refund',
        description: 'Queue a refund for a completed payment',
        inputSchema: {
          type: 'object',
          properties: {
            transaction_id: { type: 'string', description: 'Original transaction ID' },
            amount: { type: 'number', description: 'Refund amount (partial or full)' },
            reason: { type: 'string', description: 'Reason for refund' },
          },
          required: ['transaction_id', 'reason'],
        },
      },
    ],
    resources: [
      {
        uri: 'payment://methods',
        name: 'Payment Methods',
        description: 'Available payment methods and their configuration',
        mimeType: 'application/json',
      },
      {
        uri: 'payment://fee-structure',
        name: 'Fee Structure',
        description: 'Service pricing: KES 50 per service item',
        mimeType: 'application/json',
      },
    ],
  });
}

export const FEE_STRUCTURE = {
  nil_return_individual: { amount: 50, currency: 'KES', description: 'Individual nil return filing' },
  nil_return_company_per_obligation: { amount: 50, currency: 'KES', description: 'Company nil return per obligation' },
  obligation_termination: { amount: 50, currency: 'KES', description: 'Obligation termination per obligation' },
  password_reset: { amount: 50, currency: 'KES', description: 'KRA password reset' },
  email_change: { amount: 50, currency: 'KES', description: 'KRA email change assistance' },
  nssf_registration: { amount: 50, currency: 'KES', description: 'NSSF registration guidance' },
  shif_registration: { amount: 50, currency: 'KES', description: 'SHIF registration guidance' },
};
