import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";

// ──────────────────────────────────────────
// 1. CORS POLICY
// ──────────────────────────────────────────
export function applyCors(req: VercelRequest, res: VercelResponse): void {
    const origin = req.headers.origin;
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
        ? process.env.ALLOWED_ORIGINS.split(",") 
        : ["http://localhost:5173", "https://pitchside-orcin.vercel.app"];

    // If no origin (e.g., server-to-server or same-origin), we allow it through or safely ignore CORS headers
    if (!origin) return;

    if (allowedOrigins.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
        // We set a neutral "null" rather than wildcard "*" to prevent CSRF/cross-origin access
        res.setHeader("Access-Control-Allow-Origin", "null");
    }

    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
}

// ──────────────────────────────────────────
// 2. RATE LIMITING
// ──────────────────────────────────────────
interface RateLimitRecord {
    count: number;
    resetTime: number;
}
// Using a global map. In Vercel serverless, this persists for the lifetime of the warm lambda container.
// It provides adequate baseline DOS/brute-force protection.
const rateLimitMap = new Map<string, RateLimitRecord>();

export function checkRateLimit(req: VercelRequest, res: VercelResponse): boolean {
    // Defaults: 100 requests per 1 minute window per IP
    const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10);
    const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100", 10);

    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0] || req.socket?.remoteAddress || "unknown";
    const now = Date.now();

    let record = rateLimitMap.get(ip);

    if (!record || record.resetTime < now) {
        // New window
        record = { count: 1, resetTime: now + WINDOW_MS };
    } else {
        // Existing window
        record.count++;
    }

    rateLimitMap.set(ip, record);

    res.setHeader("X-RateLimit-Limit", MAX_REQUESTS);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, MAX_REQUESTS - record.count));
    res.setHeader("X-RateLimit-Reset", Math.floor(record.resetTime / 1000));

    if (record.count > MAX_REQUESTS) {
        res.status(429).json({ error: "Too Many Requests. Please try again later." });
        return false; // Limit exceeded
    }

    return true; // OK to proceed
}

// ──────────────────────────────────────────
// 3. AUTHENTICATION (JWT)
// ──────────────────────────────────────────
export function requireAuth(req: VercelRequest, res: VercelResponse): boolean {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized: Missing token" });
        return false;
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET || "fallback_dev_secret_do_not_use_in_prod";

    try {
        jwt.verify(token, secret);
        return true;
    } catch (err) {
        res.status(403).json({ error: "Forbidden: Invalid or expired token" });
        return false;
    }
}
