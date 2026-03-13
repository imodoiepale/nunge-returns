// mcp-servers/kra-mcp/index.ts
// KRA MCP Server — tools for PIN validation, obligation management, filing, password reset

import { registerServer } from '@/lib/mcp/client';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function registerKraMcp(): void {
  registerServer({
    name: 'kra-mcp',
    description: 'KRA iTax portal tools — PIN validation, nil return filing, obligation management, password reset',
    baseUrl: `${BASE_URL}/api/mcp/kra`,
    tools: [
      {
        name: 'validate_pin',
        description: 'Validate a KRA PIN and get taxpayer details (name, email, phone, business info)',
        inputSchema: {
          type: 'object',
          properties: {
            pin: { type: 'string', description: 'KRA PIN (format: A/P + 9 digits + letter)' },
          },
          required: ['pin'],
        },
      },
      {
        name: 'check_obligations',
        description: 'Check registered tax obligations for a company PIN',
        inputSchema: {
          type: 'object',
          properties: {
            pin: { type: 'string', description: 'Company KRA PIN (starts with P)' },
          },
          required: ['pin'],
        },
      },
      {
        name: 'file_nil_return',
        description: 'File a nil tax return for an individual. Requires KRA PIN and password.',
        inputSchema: {
          type: 'object',
          properties: {
            pin: { type: 'string', description: 'KRA PIN' },
            password: { type: 'string', description: 'KRA iTax password' },
            resident_type: { type: 'string', description: 'Resident type: 1=resident, 2=non-resident', enum: ['1', '2'] },
          },
          required: ['pin', 'password'],
        },
      },
      {
        name: 'batch_file_nil_returns',
        description: 'File nil returns for multiple company obligations in one session. Login once, file all selected obligations.',
        inputSchema: {
          type: 'object',
          properties: {
            pin: { type: 'string', description: 'Company KRA PIN (starts with P)' },
            password: { type: 'string', description: 'KRA iTax password' },
            company_name: { type: 'string', description: 'Company name' },
            obligation_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of obligation IDs to file (7=PAYE, 9=VAT, 4=Company IT, 5=MRI, 8=Turnover Tax)',
            },
          },
          required: ['pin', 'password', 'obligation_ids'],
        },
      },
      {
        name: 'terminate_obligation',
        description: 'Submit a request to deregister/terminate a company tax obligation',
        inputSchema: {
          type: 'object',
          properties: {
            pin: { type: 'string', description: 'Company KRA PIN' },
            password: { type: 'string', description: 'KRA iTax password' },
            company_name: { type: 'string', description: 'Company name' },
            obligation_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Obligation IDs to terminate',
            },
            reason: { type: 'string', description: 'Termination reason (e.g. Business Closed, Business Dormant)' },
          },
          required: ['pin', 'password', 'obligation_ids', 'reason'],
        },
      },
      {
        name: 'reset_password',
        description: 'Initiate a KRA password reset. Reset link sent to registered email.',
        inputSchema: {
          type: 'object',
          properties: {
            pin: { type: 'string', description: 'KRA PIN' },
          },
          required: ['pin'],
        },
      },
      {
        name: 'validate_password',
        description: 'Validate a KRA PIN and password combination',
        inputSchema: {
          type: 'object',
          properties: {
            pin: { type: 'string', description: 'KRA PIN' },
            password: { type: 'string', description: 'KRA iTax password' },
          },
          required: ['pin', 'password'],
        },
      },
      {
        name: 'get_taxpayer_details',
        description: 'Get detailed taxpayer info by PIN or ID number',
        inputSchema: {
          type: 'object',
          properties: {
            pin: { type: 'string', description: 'KRA PIN' },
            id_number: { type: 'string', description: 'National ID number (alternative to PIN)' },
          },
        },
      },
    ],
    resources: [
      {
        uri: 'kra://obligation-types',
        name: 'Obligation Types',
        description: 'Mapping of obligation IDs to names',
        mimeType: 'application/json',
      },
      {
        uri: 'kra://tax-periods',
        name: 'Tax Filing Periods',
        description: 'Current and past tax filing periods',
        mimeType: 'application/json',
      },
      {
        uri: 'kra://penalty-rates',
        name: 'KRA Penalty Rates',
        description: 'Late filing penalty rates and calculations',
        mimeType: 'application/json',
      },
    ],
  });
}

// Static resource data
export const OBLIGATION_TYPES: Record<string, string> = {
  '1': 'Resident Individual',
  '4': 'Income Tax - Company',
  '5': 'MRI (Monthly Rental Income)',
  '7': 'PAYE (Pay As You Earn)',
  '8': 'Turnover Tax',
  '9': 'VAT (Value Added Tax)',
};

export const PENALTY_RATES = {
  late_filing_individual: { amount: 2000, description: 'KES 2,000 per month or 5% of tax due (whichever is higher)' },
  late_filing_company: { amount: 20000, description: 'KES 20,000 per month or 5% of tax due' },
  late_payment: { rate: 0.02, description: '2% per month on unpaid tax' },
  interest: { rate: 0.01, description: '1% per month on unpaid tax (compounding)' },
};
