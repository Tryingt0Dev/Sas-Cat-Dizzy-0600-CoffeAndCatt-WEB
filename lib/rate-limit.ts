import { headers } from "next/headers";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function pruneExpiredBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) return;

  for (const [key, bucket] of Array.from(buckets.entries())) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  if (buckets.size < MAX_BUCKETS) return;

  const overflow = buckets.size - MAX_BUCKETS;
  let removed = 0;
  for (const key of Array.from(buckets.keys())) {
    buckets.delete(key);
    removed += 1;
    if (removed >= overflow) break;
  }
}

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super("Demasiados intentos. Intenta nuevamente mas tarde.");
  }
}

export async function getClientIp() {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || h.get("x-real-ip") || "local";
}

export function assertRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  pruneExpiredBuckets(now);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  if (current.count >= limit) {
    throw new RateLimitError(Math.ceil((current.resetAt - now) / 1000));
  }

  current.count += 1;
}
