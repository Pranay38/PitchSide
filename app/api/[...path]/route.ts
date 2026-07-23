/**
 * Catch-all API route handler for Next.js.
 * Mirrors the existing api/sys.ts consolidated handler pattern.
 * 
 * Routes:
 *   /api/posts      → api/posts.ts handler
 *   /api/comments   → api/comments.ts handler
 *   /api/likes      → api/likes.ts handler
 *   /api/fixtures   → api/fixtures.ts handler
 *   /api/news       → api/news.ts handler
 *   /api/push       → api/push.ts handler
 *   /api/react      → api/react.ts handler
 *   /api/standings  → api/standings.ts handler
 *   /api/*          → api/sys.ts handler (consolidated routes via query param)
 */
import { NextRequest, NextResponse } from "next/server";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { IncomingMessage, ServerResponse } from "http";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Import existing handlers
// NOTE: Directory renamed from api/ to _api/ to prevent Vercel from
// auto-detecting these files as standalone Serverless Functions.
import postsHandler from "../../../_api/posts";
import commentsHandler from "../../../_api/comments";
import likesHandler from "../../../_api/likes";
import fixturesHandler from "../../../_api/fixtures";
import newsHandler from "../../../_api/news";
import pushHandler from "../../../_api/push";
import reactHandler from "../../../_api/react";
import standingsHandler from "../../../_api/standings";
import storiesHandler from "../../../_api/stories";
import sysHandler from "../../../_api/sys";
import seasonTransfersHandler from "../../../_api/season-transfers";
import transfersTickerHandler from "../../../_api/transfers-ticker";

// Global Upstash Rate Limiter
let globalRatelimit: Ratelimit | null = null;
function getGlobalRatelimit() {
  if (globalRatelimit) return globalRatelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  globalRatelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(30, "60 s"),
    analytics: true,
    prefix: "pitchside:global:ratelimit",
  });
  return globalRatelimit;
}

// Map of direct API routes to their handlers
const DIRECT_HANDLERS: Record<string, (req: any, res: any) => Promise<any>> = {
  posts: postsHandler,
  comments: commentsHandler,
  likes: likesHandler,
  fixtures: fixturesHandler,
  news: newsHandler,
  push: pushHandler,
  react: reactHandler,
  standings: standingsHandler,
  stories: storiesHandler,
  "season-transfers": seasonTransfersHandler,
  "transfers-ticker": transfersTickerHandler,
};

// Routes that go through sys.ts consolidated handler
const SYS_ROUTES = new Set([
  "auth", "on-this-day", "predictions", "run-in", "title-race",
  "poll-of-week", "collections", "debates", "notify", "settings",
  "subscribers", "digest", "analytics", "generate-carousel", "ai-generate",
  "tactics", "og", "club-season", "transfers", "user-prefs",
  "polls", "polls-vote", "match-ratings", "match-ratings-vote",
  "armchair-ratings", "armchair-ratings-vote",
  "sitemap", "notifications", "recommendations", "recommendations-track",
  "daily-features", "error-log", "rss", "ensure-indexes", "search",
  "football-data", "transfer-source-preview", "welcome-sequence"
]);

/**
 * Adapter: converts Next.js Request/Response to VercelRequest/VercelResponse
 * so existing handlers continue to work without modification.
 */
async function adaptToVercel(
  request: NextRequest,
  pathSegments: string[],
  handler: (req: any, res: any) => Promise<any>
): Promise<NextResponse> {
  const url = new URL(request.url);
  const searchParams = Object.fromEntries(url.searchParams.entries());

  let body: any = undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.json();
    } catch {
      try {
        body = await request.text();
      } catch {
        body = undefined;
      }
    }
  }

  // Build a mock VercelRequest
  const req: any = {
    method: request.method,
    url: url.pathname + url.search,
    headers: Object.fromEntries(request.headers.entries()),
    query: searchParams,
    body,
    cookies: Object.fromEntries(
      request.headers
        .get("cookie")
        ?.split(";")
        .map((c) => c.trim().split("="))
        .map(([k, ...v]) => [k, v.join("=")]) || []
    ),
  };

  // Build a mock VercelResponse that captures the output
  let statusCode = 200;
  const responseHeaders: Record<string, string> = {};
  let responseBody: any = undefined;
  let ended = false;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    setHeader(key: string, value: string) {
      responseHeaders[key] = value;
      return res;
    },
    json(data: any) {
      responseHeaders["Content-Type"] = "application/json";
      responseBody = JSON.stringify(data);
      ended = true;
      return res;
    },
    send(data: any) {
      responseBody = data;
      ended = true;
      return res;
    },
    end(data?: any) {
      if (data) responseBody = data;
      ended = true;
      return res;
    },
    redirect(urlOrStatus: string | number, url?: string) {
      if (typeof urlOrStatus === "number") {
        statusCode = urlOrStatus;
        responseHeaders["Location"] = url || "/";
      } else {
        statusCode = 302;
        responseHeaders["Location"] = urlOrStatus;
      }
      ended = true;
      return res;
    },
    // For OG image handler which writes raw bytes
    write(chunk: any) {
      responseBody = chunk;
      return true;
    },
  };

  await handler(req, res);

  return new NextResponse(responseBody, {
    status: statusCode,
    headers: responseHeaders,
  });
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const route = pathSegments[0] || "";

  // Check for CORS preflight
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Apply Global Upstash Rate Limiting
  const limiter = getGlobalRatelimit();
  if (limiter) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || "unknown";
    try {
      const { success, limit, remaining, reset } = await limiter.limit(ip);
      if (!success) {
        return new NextResponse(
          JSON.stringify({ error: "Too many requests", retryAfter: Math.ceil((reset - Date.now()) / 1000) }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": remaining.toString(),
              "X-RateLimit-Reset": reset.toString(),
            },
          }
        );
      }
    } catch (err) {
      console.error("[Global RateLimit] Upstash error:", err);
      // Fail-open
    }
  }

  // Direct handler (posts, comments, likes, etc.)
  if (DIRECT_HANDLERS[route]) {
    return adaptToVercel(request, pathSegments, DIRECT_HANDLERS[route]);
  }

  // Sys consolidated handler (auth, settings, subscribers, etc.)
  if (route === "sys" || SYS_ROUTES.has(route)) {
    // Inject the route as a query parameter (matching vercel.json rewrite pattern)
    const url = new URL(request.url);
    
    if (route !== "sys") {
      // Handle special cases with sub-routes
      if (route === "polls-vote" || route === "match-ratings-vote") {
        url.searchParams.set("action", route);
        const id = pathSegments[1];
        if (id) url.searchParams.set("id", id);
      } else if ((route === "polls" || route === "match-ratings") && pathSegments.length > 1) {
        url.searchParams.set("action", route);
        url.searchParams.set("id", pathSegments[1]);
        if (pathSegments[2] === "vote") {
          url.searchParams.set("action", `${route}-vote`);
        }
      } else {
        url.searchParams.set("route", route);
      }
    }

    const adaptedRequest = new NextRequest(url, {
      method: request.method,
      headers: request.headers,
      body: request.method !== "GET" && request.method !== "HEAD" 
        ? await request.text().catch(() => null) 
        : undefined,
    });

    return adaptToVercel(adaptedRequest, pathSegments, sysHandler);
  }

  return NextResponse.json({ error: "API route not found: " + route }, { status: 404 });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path || []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path || []);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path || []);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path || []);
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return handleRequest(request, path || []);
}
