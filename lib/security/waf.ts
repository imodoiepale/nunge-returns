// lib/security/waf.ts
// Web Application Firewall middleware — XSS, CSRF, SQL injection, request limits

import { NextRequest, NextResponse } from 'next/server';
import { isMaliciousInput } from './input-sanitizer';
import { getRateLimiter } from './rate-limiter';
import { logSecurityEvent } from './audit-logger';
import { hashSha256 } from './encryption';

const MAX_BODY_SIZE = 1024 * 1024; // 1MB
const BLOCKED_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /nessus/i,
  /dirbuster/i,
  /havij/i,
  /acunetix/i,
];

export interface WafResult {
  allowed: boolean;
  statusCode?: number;
  reason?: string;
}

/**
 * Check request against WAF rules
 */
export async function checkRequest(req: NextRequest): Promise<WafResult> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') || 'unknown';
  const userAgent = req.headers.get('user-agent') || '';
  const url = req.nextUrl.pathname;

  // 1. Block known scanner user agents
  if (BLOCKED_USER_AGENTS.some(pattern => pattern.test(userAgent))) {
    await logSecurityEvent({
      eventType: 'suspicious_request',
      severity: 'high',
      sourceIp: ip,
      userAgent,
      endpoint: url,
      details: 'Blocked scanner user agent',
      blocked: true,
    });
    return { allowed: false, statusCode: 403, reason: 'Forbidden' };
  }

  // 2. Rate limiting
  const rateLimiter = getRateLimiter();
  const category = getCategoryForEndpoint(url);
  const rateResult = rateLimiter.check(ip, category);

  if (!rateResult.allowed) {
    await logSecurityEvent({
      eventType: 'rate_limit_exceeded',
      severity: 'medium',
      sourceIp: ip,
      endpoint: url,
      details: `Rate limit exceeded for ${category}`,
      metadata: { retryAfterMs: rateResult.retryAfterMs },
      blocked: true,
    });
    return { allowed: false, statusCode: 429, reason: 'Too Many Requests' };
  }

  // 3. Check URL for path traversal
  if (url.includes('..') || url.includes('%2e%2e') || url.includes('%252e')) {
    await logSecurityEvent({
      eventType: 'suspicious_request',
      severity: 'high',
      sourceIp: ip,
      endpoint: url,
      details: 'Path traversal attempt',
      blocked: true,
    });
    return { allowed: false, statusCode: 400, reason: 'Bad Request' };
  }

  // 4. Check query parameters for injection
  const searchParams = req.nextUrl.searchParams;
  for (const [key, value] of searchParams.entries()) {
    const check = isMaliciousInput(value);
    if (check.isMalicious) {
      await logSecurityEvent({
        eventType: check.reason === 'sql_injection_pattern' ? 'sql_injection' : 'xss_attempt',
        severity: 'high',
        sourceIp: ip,
        endpoint: url,
        details: `Malicious query param: ${key}=${check.reason}`,
        metadata: { param: key, reason: check.reason },
        blocked: true,
      });
      return { allowed: false, statusCode: 400, reason: 'Bad Request' };
    }
  }

  return { allowed: true };
}

/**
 * Check request body for malicious content (call for POST/PUT/PATCH)
 */
export async function checkRequestBody(body: string, ip: string, endpoint: string): Promise<WafResult> {
  // Size check
  if (body.length > MAX_BODY_SIZE) {
    return { allowed: false, statusCode: 413, reason: 'Request body too large' };
  }

  // Check for injection in body
  const check = isMaliciousInput(body);
  if (check.isMalicious) {
    await logSecurityEvent({
      eventType: check.reason === 'sql_injection_pattern' ? 'sql_injection' : 'xss_attempt',
      severity: 'high',
      sourceIp: ip,
      endpoint,
      requestBodyHash: hashSha256(body),
      details: `Malicious request body: ${check.reason}`,
      blocked: true,
    });
    return { allowed: false, statusCode: 400, reason: 'Bad Request' };
  }

  return { allowed: true };
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://itax.kra.go.ke wss://*.supabase.co;"
  );
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return response;
}

/**
 * Determine rate limit category from endpoint
 */
function getCategoryForEndpoint(url: string): string {
  if (url.startsWith('/api/whatsapp/webhook')) return 'webhook';
  if (url.startsWith('/api/auth') || url.startsWith('/api/validate-password')) return 'auth';
  if (url.startsWith('/api/individual') || url.startsWith('/api/company')) return 'filing';
  if (url.startsWith('/api/whatsapp')) return 'whatsapp';
  return 'api';
}
