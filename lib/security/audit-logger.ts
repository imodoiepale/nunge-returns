// lib/security/audit-logger.ts
// Immutable audit log for all sensitive operations

import { supabase } from '@/lib/supabaseClient';
import { hashSha256 } from './encryption';

export type SecurityEventType =
  | 'prompt_injection'
  | 'rate_limit_exceeded'
  | 'auth_failure'
  | 'suspicious_request'
  | 'data_access'
  | 'encryption_operation'
  | 'api_abuse'
  | 'brute_force'
  | 'xss_attempt'
  | 'sql_injection'
  | 'token_expired'
  | 'unauthorized_access'
  | 'config_change';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface AuditEntry {
  eventType: SecurityEventType;
  severity: Severity;
  sourceIp?: string;
  sourcePhone?: string;
  userAgent?: string;
  endpoint?: string;
  requestBodyHash?: string;
  details?: string;
  metadata?: Record<string, any>;
  blocked?: boolean;
}

// In-memory buffer for batch inserts (reduces DB writes)
let buffer: AuditEntry[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const BUFFER_SIZE = 20;
const FLUSH_INTERVAL_MS = 5000;

/**
 * Log a security event (buffered for performance)
 */
export async function logSecurityEvent(entry: AuditEntry): Promise<void> {
  buffer.push(entry);

  // Flush immediately for critical/high severity
  if (entry.severity === 'critical' || entry.severity === 'high') {
    await flushBuffer();
    return;
  }

  // Otherwise batch
  if (buffer.length >= BUFFER_SIZE) {
    await flushBuffer();
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => flushBuffer(), FLUSH_INTERVAL_MS);
  }
}

/**
 * Flush the buffer to Supabase
 */
async function flushBuffer(): Promise<void> {
  if (buffer.length === 0) return;

  const entries = [...buffer];
  buffer = [];

  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  try {
    const rows = entries.map(entry => ({
      event_type: entry.eventType,
      severity: entry.severity,
      source_ip: entry.sourceIp || null,
      source_phone: entry.sourcePhone || null,
      user_agent: entry.userAgent || null,
      endpoint: entry.endpoint || null,
      request_body_hash: entry.requestBodyHash || null,
      details: entry.details || null,
      metadata: entry.metadata || {},
      blocked: entry.blocked || false,
    }));

    const { error } = await supabase.from('security_events').insert(rows);

    if (error) {
      console.error('[AUDIT] Failed to flush security events:', error);
      // Re-add to buffer on failure (with limit to prevent infinite growth)
      if (buffer.length < 200) {
        buffer.push(...entries);
      }
    }
  } catch (err) {
    console.error('[AUDIT] Exception flushing security events:', err);
  }
}

/**
 * Log and immediately persist (for critical events)
 */
export async function logCriticalEvent(
  eventType: SecurityEventType,
  details: string,
  metadata?: Record<string, any>,
  sourceIp?: string
): Promise<void> {
  await logSecurityEvent({
    eventType,
    severity: 'critical',
    details,
    metadata,
    sourceIp,
    blocked: true,
  });
}

/**
 * Helper: log a prompt injection attempt
 */
export async function logPromptInjection(
  input: string,
  label: string,
  sourcePhone?: string,
  sourceIp?: string
): Promise<void> {
  await logSecurityEvent({
    eventType: 'prompt_injection',
    severity: 'high',
    sourcePhone,
    sourceIp,
    details: `Prompt injection detected: ${label}`,
    metadata: { label, inputHash: hashSha256(input), inputLength: input.length },
    blocked: true,
  });
}

/**
 * Helper: log rate limit exceeded
 */
export async function logRateLimitExceeded(
  identifier: string,
  category: string,
  endpoint?: string,
  sourceIp?: string
): Promise<void> {
  await logSecurityEvent({
    eventType: 'rate_limit_exceeded',
    severity: 'medium',
    sourceIp,
    endpoint,
    details: `Rate limit exceeded for ${category}:${identifier}`,
    metadata: { identifier, category },
    blocked: true,
  });
}

/**
 * Helper: log auth failure
 */
export async function logAuthFailure(
  reason: string,
  endpoint?: string,
  sourceIp?: string,
  userAgent?: string
): Promise<void> {
  await logSecurityEvent({
    eventType: 'auth_failure',
    severity: 'medium',
    sourceIp,
    userAgent,
    endpoint,
    details: `Auth failure: ${reason}`,
    blocked: false,
  });
}

/**
 * Query recent security events (for admin dashboard)
 */
export async function getRecentEvents(
  limit: number = 50,
  severity?: Severity,
  eventType?: SecurityEventType
): Promise<any[]> {
  let query = supabase
    .from('security_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (severity) {
    query = query.eq('severity', severity);
  }
  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[AUDIT] Failed to query events:', error);
    return [];
  }
  return data || [];
}

/**
 * Get threat summary for the last N hours
 */
export async function getThreatSummary(hours: number = 24): Promise<Record<string, number>> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('security_events')
    .select('event_type')
    .gte('created_at', since);

  if (error || !data) return {};

  const summary: Record<string, number> = {};
  for (const row of data) {
    summary[row.event_type] = (summary[row.event_type] || 0) + 1;
  }
  return summary;
}
