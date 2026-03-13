// lib/ai/response-validator.ts
// Validate AI responses before executing actions — prevents hallucinated tool calls

import { checkOutputForCanaryLeak } from '../security/prompt-guard';
import { logSecurityEvent } from '../security/audit-logger';

export interface ValidationRule {
  name: string;
  validate: (response: any) => { valid: boolean; error?: string };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedResponse?: any;
}

// --- Built-in validators ---

const VALIDATORS: Map<string, ValidationRule[]> = new Map();

function registerDefaults(): void {
  // Validate KRA filing response
  registerRules('kra-filing', [
    {
      name: 'has_pin',
      validate: (r) => {
        if (!r.pin || typeof r.pin !== 'string') return { valid: false, error: 'Missing or invalid PIN' };
        if (!/^[AP]\d{9}[A-Z]$/.test(r.pin.toUpperCase())) return { valid: false, error: 'Invalid PIN format' };
        return { valid: true };
      },
    },
    {
      name: 'has_action',
      validate: (r) => {
        const validActions = ['file_nil_return', 'batch_file', 'check_obligations', 'check_status'];
        if (!r.action || !validActions.includes(r.action)) return { valid: false, error: `Invalid action. Must be one of: ${validActions.join(', ')}` };
        return { valid: true };
      },
    },
  ]);

  // Validate obligation termination response
  registerRules('obligation-termination', [
    {
      name: 'has_pin',
      validate: (r) => {
        if (!r.pin || !/^P\d{9}[A-Z]$/.test(r.pin.toUpperCase())) return { valid: false, error: 'Company PIN required (starts with P)' };
        return { valid: true };
      },
    },
    {
      name: 'has_obligation',
      validate: (r) => {
        if (!r.obligation_id) return { valid: false, error: 'Missing obligation_id' };
        return { valid: true };
      },
    },
    {
      name: 'has_reason',
      validate: (r) => {
        if (!r.reason || r.reason.length < 5) return { valid: false, error: 'Termination reason required (min 5 chars)' };
        return { valid: true };
      },
    },
  ]);

  // Validate payment response
  registerRules('payment', [
    {
      name: 'has_phone',
      validate: (r) => {
        if (!r.phone) return { valid: false, error: 'Missing phone number' };
        const cleaned = r.phone.replace(/[\s-()]/g, '');
        if (!/^(\+?254|0)\d{9}$/.test(cleaned)) return { valid: false, error: 'Invalid phone number format' };
        return { valid: true };
      },
    },
    {
      name: 'has_amount',
      validate: (r) => {
        if (!r.amount || typeof r.amount !== 'number' || r.amount < 1) return { valid: false, error: 'Invalid amount' };
        return { valid: true };
      },
    },
  ]);

  // Validate ticket creation
  registerRules('ticket', [
    {
      name: 'has_subject',
      validate: (r) => {
        if (!r.subject || r.subject.length < 3) return { valid: false, error: 'Ticket subject required' };
        return { valid: true };
      },
    },
    {
      name: 'has_category',
      validate: (r) => {
        const valid = ['billing', 'technical', 'service', 'account', 'general', 'bug', 'feature_request'];
        if (!r.category || !valid.includes(r.category)) return { valid: false, error: `Invalid category. Must be: ${valid.join(', ')}` };
        return { valid: true };
      },
    },
  ]);

  // Generic intent classification validator
  registerRules('intent', [
    {
      name: 'has_intent',
      validate: (r) => {
        if (!r.intent || typeof r.intent !== 'string') return { valid: false, error: 'Missing intent' };
        return { valid: true };
      },
    },
    {
      name: 'has_confidence',
      validate: (r) => {
        if (typeof r.confidence !== 'number' || r.confidence < 0 || r.confidence > 1) return { valid: false, error: 'Confidence must be 0-1' };
        return { valid: true };
      },
    },
  ]);
}

// --- Public API ---

export function registerRules(schema: string, rules: ValidationRule[]): void {
  VALIDATORS.set(schema, rules);
}

/**
 * Validate a structured AI response against a named schema
 */
export function validate(schema: string, response: any): ValidationResult {
  if (VALIDATORS.size === 0) registerDefaults();

  const rules = VALIDATORS.get(schema);
  if (!rules) {
    return { valid: true, errors: [], sanitizedResponse: response };
  }

  const errors: string[] = [];
  for (const rule of rules) {
    const result = rule.validate(response);
    if (!result.valid && result.error) {
      errors.push(`[${rule.name}] ${result.error}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sanitizedResponse: errors.length === 0 ? response : undefined,
  };
}

/**
 * Validate raw AI text output for safety issues
 */
export async function validateOutput(output: string): Promise<{ safe: boolean; issues: string[] }> {
  const issues: string[] = [];

  // Check for canary token leaks
  if (checkOutputForCanaryLeak(output)) {
    issues.push('canary_token_leak');
    await logSecurityEvent({
      eventType: 'prompt_injection',
      severity: 'critical',
      details: 'AI output contains canary tokens — possible prompt leak',
      blocked: true,
    });
  }

  // Check for sensitive data patterns in output
  const sensitivePatterns = [
    { pattern: /\b[AP]\d{9}[A-Z]\b.*password\s*[:=]\s*\S+/i, label: 'password_exposure' },
    { pattern: /ENCRYPTION_KEY|JWT_SECRET|HMAC_SECRET|API_KEY/g, label: 'env_var_leak' },
    { pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+/g, label: 'jwt_leak' },
  ];

  for (const { pattern, label } of sensitivePatterns) {
    if (pattern.test(output)) {
      issues.push(label);
    }
  }

  return { safe: issues.length === 0, issues };
}

/**
 * Parse and validate a JSON response from AI
 */
export function parseAndValidate(rawOutput: string, schema: string): ValidationResult {
  // Strip markdown code blocks
  const cleaned = rawOutput.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { valid: false, errors: ['Failed to parse AI response as JSON'] };
  }

  return validate(schema, parsed);
}

/**
 * List registered schemas
 */
export function listSchemas(): string[] {
  if (VALIDATORS.size === 0) registerDefaults();
  return Array.from(VALIDATORS.keys());
}
