"use client";
/**
 * AdminGuard — NextAuth wrapper for the admin route.
 * If authenticated → show AdminPage directly.
 * Otherwise → show AdminLogin.
 */
import { lazy, Suspense } from "react";
import { useSession } from "next-auth/react";
import { AdminLogin } from "./AdminLogin";

const AdminPage = lazy(() =>
  import("../pages/AdminPage").then((m) => ({ default: m.AdminPage }))
);

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
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <AdminSpinner />;
  }

  if (status === "authenticated") {
    return <LazyAdmin />;
  }

  return <AdminLogin />;
}
