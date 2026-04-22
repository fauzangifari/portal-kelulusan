type Bucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const globalForRateLimit = globalThis as typeof globalThis & {
  rateLimitBuckets?: Map<string, Bucket>;
};

const buckets = globalForRateLimit.rateLimitBuckets ?? new Map<string, Bucket>();
if (!globalForRateLimit.rateLimitBuckets) {
  globalForRateLimit.rateLimitBuckets = buckets;
}

export function checkRateLimit(key: string) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }

  if (existing.count >= MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: existing.resetAt - now,
    };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return { allowed: true, remaining: MAX_REQUESTS - existing.count };
}
