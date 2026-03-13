// lib/security/encryption.ts
// AES-256-GCM encryption for sensitive data at rest (KRA passwords, PINs)

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  // Derive a proper 256-bit key from the env var using PBKDF2
  const salt = crypto.createHash('sha256').update('nunge-returns-salt-v1').digest();
  return crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha512');
}

export interface EncryptedData {
  encrypted: string; // base64 encoded ciphertext
  iv: string;        // base64 encoded IV
  tag: string;       // base64 encoded auth tag
  v: number;         // version for key rotation
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 */
export function encrypt(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const tag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    v: 1,
  };
}

/**
 * Decrypt an EncryptedData object back to plaintext
 */
export function decrypt(data: EncryptedData): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(data.iv, 'base64');
  const tag = Buffer.from(data.tag, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(data.encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Encrypt to a single compact string (for DB storage)
 * Format: v1:iv:tag:ciphertext (all base64)
 */
export function encryptToString(plaintext: string): string {
  const data = encrypt(plaintext);
  return `v${data.v}:${data.iv}:${data.tag}:${data.encrypted}`;
}

/**
 * Decrypt from compact string format
 */
export function decryptFromString(compactString: string): string {
  const parts = compactString.split(':');
  if (parts.length !== 4) {
    throw new Error('Invalid encrypted string format');
  }

  const version = parseInt(parts[0].replace('v', ''), 10);
  const data: EncryptedData = {
    v: version,
    iv: parts[1],
    tag: parts[2],
    encrypted: parts[3],
  };

  return decrypt(data);
}

/**
 * Hash a value for comparison without revealing it (e.g., request body hashing for audit)
 */
export function hashSha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}

/**
 * Generate HMAC signature for request signing
 */
export function generateHmac(payload: string, secret?: string): string {
  const hmacSecret = secret || process.env.HMAC_SECRET;
  if (!hmacSecret) {
    throw new Error('HMAC_SECRET environment variable is not set');
  }
  return crypto.createHmac('sha256', hmacSecret).update(payload).digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHmac(payload: string, signature: string, secret?: string): boolean {
  const expected = generateHmac(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(signature, 'hex')
  );
}

/**
 * Generate a cryptographically secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
