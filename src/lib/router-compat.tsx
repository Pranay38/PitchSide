/**
 * React Router compatibility layer for Next.js migration.
 * 
 * This module re-exports Next.js equivalents under React Router's API names,
 * so the existing 43+ component files continue to work without modification.
 */

"use client";

import NextLink from "next/link";
import { forwardRef } from "react";

export {
  useParams,
  useSearchParams,
  usePathname,
  useRouter,
  notFound,
  redirect,
} from "next/navigation";

import { useRouter as useNextRouter } from "next/navigation";

/**
 * Drop-in replacement for react-router's <Link>.
 * Accepts both `to` (react-router style) and `href` (Next.js style).
 */
type LinkProps = Omit<React.ComponentProps<typeof NextLink>, "href"> & {
  to?: string;
  href?: string;
};

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, href, ...props }, ref) => {
    return <NextLink ref={ref} href={to || href || "#"} {...props} />;
  }
);
Link.displayName = "Link";

/**
 * Drop-in replacement for react-router's useNavigate.
 */
export function useNavigate() {
  const router = useNextRouter();
  return (to: string | number, options?: { replace?: boolean }) => {
    if (typeof to === "number") {
      if (to === -1) router.back();
      else router.forward();
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
}

/**
 * Drop-in replacement for react-router's useLocation.
 */
export function useLocation() {
  const pathname = require("next/navigation").usePathname();
  const searchParams = require("next/navigation").useSearchParams();
  return {
    pathname,
    search: searchParams?.toString() ? `?${searchParams.toString()}` : "",
    hash: typeof window !== "undefined" ? window.location.hash : "",
    state: null,
    key: "default",
  };
}

/**
 * Stub for ScrollRestoration — Next.js handles scroll restoration natively.
 */
export function ScrollRestoration() {
  return null;
}

/**
 * Stub for Outlet — not needed in Next.js app router.
 */
export function Outlet() {
  return null;
}

/**
 * Drop-in replacement for react-router's <Navigate>.
 * Performs a client-side redirect on mount.
 */
export function Navigate({ to, replace }: { to: string; replace?: boolean }) {
  const router = useNextRouter();
  const { useEffect } = require("react");
  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);
  return null;
}

/**
 * Stub for RouterProvider — not needed in Next.js.
 */
export function RouterProvider(_props: any) {
  return null;
}

