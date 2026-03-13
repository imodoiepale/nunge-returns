// lib/security/input-sanitizer.ts
// Sanitize and validate all user inputs before they reach AI or DB

const HTML_REGEX = /<[^>]*>/g;
const SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|UNION|TRUNCATE)\b)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  /('|"|`)\s*(OR|AND)\s*('|"|`)/gi,
];
const XSS_PATTERNS = [
  /javascript\s*:/gi,
  /on\w+\s*=/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
  /expression\s*\(/gi,
];

export interface SanitizeOptions {
  maxLength?: number;
  allowHtml?: boolean;
  trimWhitespace?: boolean;
}

const DEFAULT_OPTIONS: SanitizeOptions = {
  maxLength: 10000,
  allowHtml: false,
  trimWhitespace: true,
};

export function sanitizeString(input: string, options: SanitizeOptions = {}): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  if (opts.trimWhitespace) {
    sanitized = sanitized.trim();
  }

  if (!opts.allowHtml) {
    sanitized = sanitized.replace(SCRIPT_REGEX, '');
    sanitized = sanitized.replace(HTML_REGEX, '');
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Enforce max length
  if (opts.maxLength && sanitized.length > opts.maxLength) {
    sanitized = sanitized.substring(0, opts.maxLength);
  }

  return sanitized;
}

export function detectSqlInjection(input: string): boolean {
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

export function detectXss(input: string): boolean {
  return XSS_PATTERNS.some(pattern => pattern.test(input));
}

export function isMaliciousInput(input: string): { isMalicious: boolean; reason?: string } {
  if (detectSqlInjection(input)) {
    return { isMalicious: true, reason: 'sql_injection_pattern' };
  }
  if (detectXss(input)) {
    return { isMalicious: true, reason: 'xss_pattern' };
  }
  return { isMalicious: false };
}

// --- Domain-specific validators ---

const KRA_PIN_REGEX = /^[AP]\d{9}[A-Z]$/;
const PHONE_REGEX = /^(?:\+?254|0)\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateKraPin(pin: string): { isValid: boolean; error?: string } {
  const cleaned = pin.toUpperCase().trim();
  if (!KRA_PIN_REGEX.test(cleaned)) {
    return { isValid: false, error: 'Invalid KRA PIN format. Must be A/P + 9 digits + letter (e.g. A001234567B)' };
  }
  return { isValid: true };
}

export function validatePhone(phone: string): { isValid: boolean; normalized?: string; error?: string } {
  const cleaned = phone.replace(/[\s-()]/g, '');
  if (!PHONE_REGEX.test(cleaned)) {
    return { isValid: false, error: 'Invalid phone number. Use format 0712345678 or +254712345678' };
  }
  // Normalize to +254 format
  let normalized = cleaned;
  if (normalized.startsWith('0')) {
    normalized = '+254' + normalized.substring(1);
  } else if (normalized.startsWith('254')) {
    normalized = '+' + normalized;
  }
  return { isValid: true, normalized };
}

export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const cleaned = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(cleaned)) {
    return { isValid: false, error: 'Invalid email address' };
  }
  if (cleaned.length > 254) {
    return { isValid: false, error: 'Email address too long' };
  }
  return { isValid: true };
}

export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleanKey = sanitizeString(key, { maxLength: 100 });
    if (typeof value === 'string') {
      sanitized[cleanKey] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[cleanKey] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[cleanKey] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    } else {
      sanitized[cleanKey] = value;
    }
  }
  return sanitized;
}
