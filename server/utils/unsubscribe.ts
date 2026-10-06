import { createHmac, timingSafeEqual } from "node:crypto";

const SITE_URL = "https://www.thetouchlinedribble.in";
function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_SECRET is required to sign unsubscribe links");
  return value;
}
function signature(payload: string) {
  return createHmac("sha256", secret()).update(`newsletter-unsubscribe:v1:${payload}`).digest("base64url");
}
export function createUnsubscribeUrl(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new Error("Invalid subscriber email");
  const payload = Buffer.from(normalized).toString("base64url");
  return `${SITE_URL}/api/unsubscribe?token=${payload}.${signature(payload)}`;
}
/** Durable, purpose-bound token: old email links remain usable while the signing key is retained. */
export function verifyUnsubscribeToken(token: string): string | null {
  if (token.length > 1024 || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const [payload, supplied] = token.split(".");
  const expected = signature(payload);
  if (!timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) return null;
  const email = Buffer.from(payload, "base64url").toString("utf8");
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}
