import { clerkMiddleware } from "@clerk/nextjs/server";

const clerkSecretKey = process.env.CLERK_SECRET_KEY;

export default function middleware(request: any, event: any) {
  if (!clerkSecretKey) {
    return;
  }
  return clerkMiddleware()(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
