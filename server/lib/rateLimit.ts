import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// ────────────────────────────────────────────────────────────
// Upstash Redis Rate Limiter
// Distributed, survives cold starts, works across all instances.
//
// Requires env vars:
//   UPSTASH_REDIS_REST_URL
//   UPSTASH_REDIS_REST_TOKEN
// ────────────────────────────────────────────────────────────

let ratelimit: Ratelimit | null = null;

function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    console.warn("[rateLimit] UPSTASH env vars missing — rate limiting disabled");
    return null;
  }

  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    // Sliding window: 30 requests per 60 seconds per IP
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    analytics: true,
    prefix: "pitchside:ratelimit",
  });

  return ratelimit;
}

/**
 * Extract client IP from Vercel request headers.
 */
function getClientIP(req: VercelRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.headers["x-real-ip"] as string || "unknown";
}

/**
 * Apply rate limiting to a request. Returns true if the request should be BLOCKED.
 * Call this at the top of any handler or middleware.
 *
 * If Upstash env vars are missing, this always returns false (fail-open).
 */
export async function applyRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  /** Optional identifier override (e.g., "error-log:1.2.3.4") */
  identifier?: string
): Promise<boolean> {
  const limiter = getRatelimit();
  if (!limiter) return false; // Fail-open if not configured

  const ip = identifier || getClientIP(req);

  try {
    const { success, limit, remaining, reset } = await limiter.limit(ip);

    // Always set rate limit headers for transparency
    res.setHeader("X-RateLimit-Limit", limit.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", reset.toString());

    if (!success) {
      res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      });
      return true; // Blocked
    }

    return false; // Allowed
  } catch (err) {
    // Fail-open: if Redis is down, don't block requests
    console.error("[rateLimit] Upstash error:", err);
    return false;
  }
}

/**
 * Stricter rate limiter for sensitive endpoints (e.g., error-log, auth).
 * 10 requests per 60 seconds.
 */
let strictLimiter: Ratelimit | null = null;

export async function applyStrictRateLimit(
  req: VercelRequest,
  res: VercelResponse
): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return false;

  if (!strictLimiter) {
    strictLimiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "pitchside:strict",
    });
  }

  const ip = getClientIP(req);

  try {
    const { success, limit, remaining, reset } = await strictLimiter.limit(ip);
    res.setHeader("X-RateLimit-Limit", limit.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", reset.toString());

    if (!success) {
      res.status(429).json({
        error: "Too many requests",
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      });
      return true;
    }
    return false;
  } catch (err) {
    console.error("[strictRateLimit] Upstash error:", err);
    return false;
  }
}
