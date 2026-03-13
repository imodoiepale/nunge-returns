// lib/security/api-shield.ts
// API protection: HMAC signing, JWT management, API key scoping

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { generateHmac, verifyHmac } from './encryption';

// --- JWT Management ---

const JWT_ISSUER = 'nunge-returns';
const JWT_AUDIENCE = 'nunge-api';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

export interface TokenPayload extends JWTPayload {
  sub: string;        // subject (user phone, email, or agent ID)
  role: string;       // user, admin, agent, mcp_server
  scope?: string[];   // permissions
  channel?: string;   // whatsapp, web, api
}

/**
 * Generate a short-lived JWT (15 min default)
 */
export async function generateToken(payload: Omit<TokenPayload, 'iss' | 'aud' | 'iat' | 'exp'>, expiresIn: string = '15m'): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT(payload as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setIssuer(JWT_ISSUER)
    .setAudience(JWT_AUDIENCE)
    .setExpirationTime(expiresIn)
    .sign(secret);
}

/**
 * Verify and decode a JWT
 */
export async function verifyToken(token: string): Promise<TokenPayload> {
  const secret = getJwtSecret();
  const { payload } = await jwtVerify(token, secret, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
  });
  return payload as TokenPayload;
}

/**
 * Generate a refresh token (7 day expiry)
 */
export async function generateRefreshToken(subject: string): Promise<string> {
  return generateToken({ sub: subject, role: 'refresh' }, '7d');
}

// --- HMAC Request Signing ---

/**
 * Sign an outgoing request for service-to-service auth
 * Signature covers: method + path + timestamp + body hash
 */
export function signRequest(method: string, path: string, body: string, timestamp: number): string {
  const payload = `${method.toUpperCase()}:${path}:${timestamp}:${body}`;
  return generateHmac(payload);
}

/**
 * Verify an incoming signed request
 * Rejects requests older than 5 minutes (replay protection)
 */
export function verifySignedRequest(
  method: string,
  path: string,
  body: string,
  timestamp: number,
  signature: string
): { valid: boolean; error?: string } {
  // Replay protection: reject if older than 5 minutes
  const now = Date.now();
  const age = now - timestamp;
  if (age > 5 * 60 * 1000) {
    return { valid: false, error: 'Request expired (replay protection)' };
  }
  if (age < -60 * 1000) {
    return { valid: false, error: 'Request timestamp is in the future' };
  }

  const payload = `${method.toUpperCase()}:${path}:${timestamp}:${body}`;
  try {
    const isValid = verifyHmac(payload, signature);
    return { valid: isValid, error: isValid ? undefined : 'Invalid signature' };
  } catch {
    return { valid: false, error: 'Signature verification failed' };
  }
}

// --- API Key Management ---

export interface ApiKeyConfig {
  key: string;
  name: string;
  scope: string[];   // allowed endpoints/actions
  rateLimit: number;  // requests per minute
  active: boolean;
}

// In production, these would be in the database
const API_KEYS: Map<string, ApiKeyConfig> = new Map();

/**
 * Register an API key (call during startup for MCP servers, etc.)
 */
export function registerApiKey(config: ApiKeyConfig): void {
  API_KEYS.set(config.key, config);
}

/**
 * Validate an API key and check scope
 */
export function validateApiKey(key: string, requiredScope?: string): { valid: boolean; config?: ApiKeyConfig; error?: string } {
  const config = API_KEYS.get(key);
  if (!config) {
    return { valid: false, error: 'Invalid API key' };
  }
  if (!config.active) {
    return { valid: false, error: 'API key is inactive' };
  }
  if (requiredScope && !config.scope.includes(requiredScope) && !config.scope.includes('*')) {
    return { valid: false, error: `API key lacks required scope: ${requiredScope}` };
  }
  return { valid: true, config };
}

// --- Request Fingerprinting ---

/**
 * Generate a fingerprint for anomaly detection
 */
export function fingerprintRequest(headers: Record<string, string>): string {
  const components = [
    headers['user-agent'] || '',
    headers['accept-language'] || '',
    headers['accept-encoding'] || '',
    headers['sec-ch-ua'] || '',
    headers['sec-ch-ua-platform'] || '',
  ];
  const raw = components.join('|');
  // Use a simple hash since crypto may not be available in edge
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}
