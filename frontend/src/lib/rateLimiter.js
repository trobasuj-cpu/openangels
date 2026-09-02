// High-performance Sliding Window Rate Limiter for Next.js API routes

class RateLimiter {
  constructor() {
    // Map of identifier -> array of timestamps in milliseconds
    this.storage = new Map();
    this.windowMs = 60 * 60 * 1000; // 1 hour sliding window
    this.limits = {
      free: 10,     // 10 generations per hour for Free / Guest users
      premium: 100  // 100 generations per hour for Pro / Lifetime users
    };

    // Periodic garbage collection every 10 minutes to prevent memory leaks
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.cleanup(), 10 * 60 * 1000);
    }
  }

  cleanup() {
    const now = Date.now();
    for (const [key, timestamps] of this.storage.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      if (valid.length === 0) {
        this.storage.delete(key);
      } else {
        this.storage.set(key, valid);
      }
    }
  }

  /**
   * Checks whether the request is allowed under the rate limit.
   * @param {string} identifier - User ID (for authenticated) or IP address (for guests)
   * @param {boolean} isPremium - Whether user has active Pro/Lifetime subscription
   * @returns {{ allowed: boolean, limit: number, remaining: number, resetInSeconds: number, current: number }}
   */
  check(identifier, isPremium = false) {
    if (!identifier) {
      identifier = 'anonymous_guest';
    }

    const now = Date.now();
    const limit = isPremium ? this.limits.premium : this.limits.free;
    const timestamps = this.storage.get(identifier) || [];

    // Filter timestamps within the 1-hour sliding window
    const recent = timestamps.filter(t => now - t < this.windowMs);
    const count = recent.length;

    const oldestTimestamp = recent[0] || now;
    const resetTime = oldestTimestamp + this.windowMs;
    const resetInSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

    if (count >= limit) {
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetInSeconds,
        current: count
      };
    }

    // Record this request timestamp
    recent.push(now);
    this.storage.set(identifier, recent);

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - recent.length),
      resetInSeconds,
      current: recent.length
    };
  }

  /**
   * Peek rate limit status without consuming a token.
   */
  peek(identifier, isPremium = false) {
    if (!identifier) identifier = 'anonymous_guest';
    const now = Date.now();
    const limit = isPremium ? this.limits.premium : this.limits.free;
    const timestamps = this.storage.get(identifier) || [];
    const recent = timestamps.filter(t => now - t < this.windowMs);
    const count = recent.length;
    const oldestTimestamp = recent[0] || now;
    const resetTime = oldestTimestamp + this.windowMs;
    const resetInSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

    return {
      limit,
      remaining: Math.max(0, limit - count),
      resetInSeconds,
      current: count
    };
  }
}

// Export singleton instance across requests
export const globalRateLimiter = new RateLimiter();
