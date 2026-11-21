import "server-only";

/**
 * Fixed-window rate limiter kept in process memory. Good enough for one
 * Node instance; move the buckets to Redis if the web app is ever scaled out.
 */
type Bucket = { count: number; resetAt: number };

const g = globalThis as unknown as { __pandoraRate?: Map<string, Bucket> };
const buckets = (g.__pandoraRate ??= new Map());
let lastSweep = 0;

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  b.count++;
  return b.count <= limit ? { ok: true, retryAfterMs: 0 } : { ok: false, retryAfterMs: b.resetAt - now };
}
