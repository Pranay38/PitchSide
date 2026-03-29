/**
 * AdminGuard — Clerk-level auth wrapper for the admin route.
 * If Clerk is available AND the user is NOT signed in → redirect to sign-in.
 * If Clerk is unavailable (no key, wrong domain) → fall through to AdminPage's
 * own password gate, which is the primary security layer.
 */
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router";
import { lazy, Suspense } from "react";

const AdminPage = lazy(() =>
  import("../pages/AdminPage").then((m) => ({ default: m.AdminPage }))
);

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const AdminSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#16A34A] border-t-transparent" />
  </div>
);

const LazyAdmin = () => (
  <Suspense fallback={<AdminSpinner />}>
    <AdminPage />
  </Suspense>
);

export function AdminGuard() {
  // If Clerk isn't configured, skip auth — rely on password gate
  if (!CLERK_KEY) return <LazyAdmin />;
  return <ClerkGuardedAdmin />;
}

function ClerkGuardedAdmin() {
  let isSignedIn = false;
  let isLoaded = true;

  try {
    const auth = useAuth();
    isSignedIn = !!auth.isSignedIn;
    isLoaded = !!auth.isLoaded;
  } catch {
    // Clerk context unavailable (domain mismatch etc.) — skip auth
    isSignedIn = true;
    isLoaded = true;
  }

  if (!isLoaded) return <AdminSpinner />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return <LazyAdmin />;
}
