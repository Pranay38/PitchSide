"use server";

import { cookies } from "next/headers";
import { createHmac } from "crypto";

const METERING_COOKIE_NAME = "_article_metering";
const FREE_ARTICLES_LIMIT = 2;
// Use JWT_SECRET or a fallback for signing the cookie
const SECRET = process.env.JWT_SECRET || "fallback_secret_for_metering";

interface MeteringData {
  count: number;
  month: string; // "YYYY-MM" to reset monthly
}

function sign(data: string): string {
  const hmac = createHmac("sha256", SECRET);
  hmac.update(data);
  return hmac.digest("hex");
}

function getMonthString() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

export async function getMeteringCount(): Promise<number> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(METERING_COOKIE_NAME);
  
  if (!cookie?.value) return 0;
  
  try {
    // Format: "data.signature"
    const [encodedData, signature] = cookie.value.split(".");
    if (sign(encodedData) !== signature) {
      return 0; // Invalid signature
    }
    
    const data: MeteringData = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"));
    
    // Check if it's a new month
    if (data.month !== getMonthString()) {
      return 0;
    }
    
    return data.count;
  } catch (error) {
    return 0;
  }
}

export async function incrementMeteringCount(postId: string) {
  // We can use a separate cookie to track which articles were read this month
  // to avoid double counting the same article, but for simplicity we'll just 
  // track read posts in a simpler way or rely on the client calling this once per article.
  // Actually, let's keep a history array to avoid double counting.
  
  const cookieStore = await cookies();
  const cookie = cookieStore.get(METERING_COOKIE_NAME);
  
  let data: MeteringData & { seen?: string[] } = { count: 0, month: getMonthString(), seen: [] };
  
  if (cookie?.value) {
    try {
      const [encodedData, signature] = cookie.value.split(".");
      if (sign(encodedData) === signature) {
        const parsed = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"));
        if (parsed.month === getMonthString()) {
          data = parsed;
          if (!data.seen) data.seen = [];
        }
      }
    } catch (e) {
      // Ignore
    }
  }
  
  // If we've already seen this post this month, don't increment
  if (data.seen?.includes(postId)) {
    return;
  }
  
  data.count += 1;
  data.seen?.push(postId);
  
  const encoded = Buffer.from(JSON.stringify(data)).toString("base64");
  const signature = sign(encoded);
  const value = `${encoded}.${signature}`;
  
  cookieStore.set(METERING_COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 31, // 31 days
  });
}

export async function hasExceededMetering(): Promise<boolean> {
  const count = await getMeteringCount();
  return count >= FREE_ARTICLES_LIMIT;
}
