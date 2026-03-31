import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirect /post/<numeric-id> → /post/<slug> for SEO.
 * Runs before page rendering for maximum reliability.
 */
async function handlePostSlugRedirect(request: NextRequest): Promise<NextResponse | null> {
  const pathname = request.nextUrl.pathname;
  const numericPostMatch = pathname.match(/^\/post\/(\d{5,})$/);
  if (!numericPostMatch) return null;

  try {
    // Use internal origin to call the posts API
    const origin = request.nextUrl.origin;
    const res = await fetch(`${origin}/api/posts`, {
      headers: { "x-middleware-slug-lookup": "1" },
      next: { revalidate: 300 }, // cache for 5 min to keep middleware fast
    });
    if (!res.ok) return null;

    const posts: Array<{ id: string; slug?: string }> = await res.json();
    const numericId = numericPostMatch[1];
    const post = posts.find((p) => String(p.id) === numericId);

    if (post?.slug && post.slug !== numericId) {
      const url = request.nextUrl.clone();
      url.pathname = `/post/${post.slug}`;
      return NextResponse.redirect(url, 308);
    }
  } catch {
    // Fail open — let the page handle it
  }
  return null;
}

export default clerkMiddleware(async (_auth, request) => {
  const redirectResponse = await handlePostSlugRedirect(request);
  if (redirectResponse) return redirectResponse;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
  unstable_allowDynamic: [
    "**/node_modules/@clerk/**/*.js",
    "**/node_modules/@clerk/nextjs/**/*.js"
  ],
};
