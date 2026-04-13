"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/app/components/ui/sonner";
import { BackToTopButton } from "@/app/components/BackToTopButton";
import { CookieBanner } from "@/app/components/CookieBanner";
import { OfflineIndicator } from "@/app/components/OfflineIndicator";
import { ErrorBoundary } from "@/app/components/ErrorBoundary";
import { UserPreferencesProvider } from "@/app/hooks/useUserPreferences";
import { MobileBottomNav } from "@/app/components/MobileBottomNav";
import { useState, Suspense } from "react";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 2,
          },
        },
      })
  );

  return (
    <ErrorBoundary>
      <SessionProvider>
        <UserPreferencesProvider>
          <QueryClientProvider client={queryClient}>
            <Suspense fallback={null}>
              <OfflineIndicator />
              <div className="pb-16 sm:pb-0">{children}</div>
              <MobileBottomNav />
            </Suspense>
            <Toaster />
            <BackToTopButton />
            <CookieBanner />
          </QueryClientProvider>
        </UserPreferencesProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}
