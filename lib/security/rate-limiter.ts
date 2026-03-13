// lib/security/rate-limiter.ts
// Token bucket rate limiter — in-memory with per-IP, per-phone, per-endpoint limits

interface Bucket {
  tokens: number;
  lastRefill: number;
}

interface RateLimitConfig {
  maxTokens: number;      // max burst size
  refillRate: number;      // tokens per second
  windowMs?: number;       // cleanup interval
}

const DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
  api: { maxTokens: 100, refillRate: 1.67 },           // 100 req/min
  whatsapp: { maxTokens: 30, refillRate: 0.5 },        // 30 msg/min
  auth: { maxTokens: 10, refillRate: 0.17 },            // 10 attempts/min
  filing: { maxTokens: 5, refillRate: 0.083 },          // 5 filings/min
  webhook: { maxTokens: 200, refillRate: 3.33 },        // 200 req/min
};

class RateLimiter {
  private buckets: Map<string, Bucket> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Cleanup stale buckets every 5 minutes
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
    }
  }

  /**
   * Check if a request is allowed under rate limits
   * @returns true if allowed, false if rate limited
   */
  check(identifier: string, category: string = 'api'): { allowed: boolean; remaining: number; retryAfterMs: number } {
    const config = DEFAULT_CONFIGS[category] || DEFAULT_CONFIGS.api;
    const key = `${category}:${identifier}`;

    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: config.maxTokens, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // Refill tokens based on elapsed time
    const elapsed = (now - bucket.lastRefill) / 1000; // seconds
    bucket.tokens = Math.min(config.maxTokens, bucket.tokens + elapsed * config.refillRate);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        retryAfterMs: 0,
      };
    }

    // Calculate when next token will be available
    const deficit = 1 - bucket.tokens;
    const retryAfterMs = Math.ceil((deficit / config.refillRate) * 1000);

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs,
    };
  }

  /**
   * Consume a token (call after check returns allowed=true)
   * This is a no-op since check() already consumes the token
   */
  consume(identifier: string, category: string = 'api'): void {
    // Token already consumed in check()
  }

  /**
   * Get rate limit headers for HTTP response
   */
  getHeaders(identifier: string, category: string = 'api'): Record<string, string> {
    const config = DEFAULT_CONFIGS[category] || DEFAULT_CONFIGS.api;
    const key = `${category}:${identifier}`;
    const bucket = this.buckets.get(key);
    const remaining = bucket ? Math.floor(bucket.tokens) : config.maxTokens;

    return {
      'X-RateLimit-Limit': config.maxTokens.toString(),
      'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
      'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + (config.maxTokens - remaining) / config.refillRate).toString(),
    };
  }

  /**
   * Reset a specific identifier's bucket
   */
  reset(identifier: string, category: string = 'api'): void {
    const key = `${category}:${identifier}`;
    this.buckets.delete(key);
  }

  /**
   * Block an identifier completely (set tokens to -1000)
   */
  block(identifier: string, category: string = 'api', durationMs: number = 60000): void {
    const key = `${category}:${identifier}`;
    this.buckets.set(key, { tokens: -1000, lastRefill: Date.now() + durationMs });
  }

  /**
   * Cleanup stale buckets (older than 10 minutes with full tokens)
   */
  private cleanup(): void {
    const now = Date.now();
    const staleThreshold = 10 * 60 * 1000; // 10 minutes

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > staleThreshold) {
        this.buckets.delete(key);
      }
    }
  }

  /**
   * Get current stats for monitoring
   */
  getStats(): { totalBuckets: number; categories: Record<string, number> } {
    const categories: Record<string, number> = {};
    for (const key of this.buckets.keys()) {
      const category = key.split(':')[0];
      categories[category] = (categories[category] || 0) + 1;
    }
    return { totalBuckets: this.buckets.size, categories };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.buckets.clear();
  }
}

// Singleton instance
let rateLimiterInstance: RateLimiter | null = null;

export function getRateLimiter(): RateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new RateLimiter();
  }
  return rateLimiterInstance;
}

export { RateLimiter };
export type { RateLimitConfig };
