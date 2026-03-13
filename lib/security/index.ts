// lib/security/index.ts
// Central export for all security modules

export { sanitizeString, sanitizeObject, validateKraPin, validatePhone, validateEmail, isMaliciousInput, detectSqlInjection, detectXss } from './input-sanitizer';
export { guardPrompt, quickGuard, checkOutputForCanaryLeak, getCanaryInstruction } from './prompt-guard';
export { encrypt, decrypt, encryptToString, decryptFromString, hashSha256, generateHmac, verifyHmac, generateSecureToken } from './encryption';
export { getRateLimiter } from './rate-limiter';
export { generateToken, verifyToken, generateRefreshToken, signRequest, verifySignedRequest, validateApiKey, registerApiKey, fingerprintRequest } from './api-shield';
export { logSecurityEvent, logCriticalEvent, logPromptInjection, logRateLimitExceeded, logAuthFailure, getRecentEvents, getThreatSummary } from './audit-logger';
export { checkRequest, checkRequestBody, addSecurityHeaders } from './waf';
