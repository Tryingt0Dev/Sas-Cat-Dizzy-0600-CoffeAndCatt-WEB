import { headers } from "next/headers";

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  count: number;
  resetAt: number;
};

type RateLimitScope = {
  endpoint: string;
  ip?: string | null;
  businessId?: string | null;
  userId?: string | null;
};

interface RateLimitBackend {
  increment(key: string, windowMs: number): Promise<RateLimitResult>;
}

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

class LocalMemoryRateLimitBackend implements RateLimitBackend {
  async increment(key: string, windowMs: number) {
    const now = Date.now();
    pruneExpiredBuckets(now);
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      const resetAt = now + windowMs;
      buckets.set(key, { count: 1, resetAt });
      return { count: 1, resetAt };
    }

    current.count += 1;
    return { count: current.count, resetAt: current.resetAt };
  }
}

class UpstashRateLimitBackend implements RateLimitBackend {
  constructor(
    private readonly url: string,
    private readonly token: string
  ) {}

  async increment(key: string, windowMs: number) {
    const redisKey = `ratelimit:${key}`;
    const res = await fetch(`${this.url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PEXPIRE", redisKey, windowMs],
        ["PTTL", redisKey]
      ])
    });

    if (!res.ok) {
      throw new Error("No se pudo consultar el rate limit remoto");
    }

    const payload = (await res.json()) as Array<{ result: unknown }>;
    const count = Number(payload[0]?.result ?? 1);
    const ttl = Math.max(0, Number(payload[2]?.result ?? windowMs));
    return { count, resetAt: Date.now() + ttl };
  }
}

let backend: RateLimitBackend | null = null;

function getBackend() {
  if (backend) return backend;
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  backend = upstashUrl && upstashToken
    ? new UpstashRateLimitBackend(upstashUrl, upstashToken)
    : new LocalMemoryRateLimitBackend();
  return backend;
}

function sanitizeKeyPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_.:-]/g, "_").slice(0, 160);
}

export class RateLimitError extends Error {
  constructor(public retryAfterSeconds: number) {
    super("Demasiados intentos. Intenta nuevamente mas tarde.");
  }
}

export async function getClientIp(req?: Request) {
  if (req) {
    const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    return forwardedFor || req.headers.get("x-real-ip") || "local";
  }

  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || h.get("x-real-ip") || "local";
}

export function rateLimitKey(scope: RateLimitScope) {
  return [
    scope.endpoint,
    scope.businessId ? `business:${scope.businessId}` : null,
    scope.userId ? `user:${scope.userId}` : null,
    scope.ip ? `ip:${scope.ip}` : null
  ]
    .filter(Boolean)
    .map((part) => sanitizeKeyPart(String(part)))
    .join("|");
}

export async function assertRateLimit(key: string, limit: number, windowMs: number) {
  const result = await getBackend().increment(key, windowMs);
  if (result.count > limit) {
    throw new RateLimitError(Math.ceil((result.resetAt - Date.now()) / 1000));
  }
}
