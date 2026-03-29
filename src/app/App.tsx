import { RouterProvider } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ClerkProvider } from "@clerk/clerk-react";
import { dark } from "@clerk/themes";
import { BackToTopButton } from "./components/BackToTopButton";
import { CookieBanner } from "./components/CookieBanner";
import { PushPrompt } from "./components/PushPrompt";
import { UserPreferencesProvider } from "./hooks/useUserPreferences";
import { useTheme } from "./hooks/useTheme";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
    },
  },
});

export default function App() {
  const { theme } = useTheme();

  const inner = (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <OfflineIndicator />
        <RouterProvider router={router} />
        <PWAInstallPrompt />
        <PushPrompt />
        <Toaster />
        <BackToTopButton />
        <CookieBanner />
      </QueryClientProvider>
    </HelmetProvider>
  );

  // If no Clerk key is configured, render the app without auth (graceful fallback)
  if (!CLERK_KEY) return <ErrorBoundary>{inner}</ErrorBoundary>;

  return (
    <ErrorBoundary>
      <ClerkProvider 
        publishableKey={CLERK_KEY}
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
        appearance={{
          baseTheme: theme === 'dark' ? dark : undefined,
          variables: {
            colorPrimary: '#16A34A',
            borderRadius: '0.75rem',
          },
          elements: {
            card: "bg-white dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 shadow-xl",
            headerTitle: "font-outfit font-black text-2xl text-slate-900 dark:text-white",
            headerSubtitle: "text-slate-500 dark:text-gray-400 font-medium",
            socialButtonsBlockButton: "border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A]/50 hover:bg-gray-50 dark:hover:bg-[#1e293b] text-slate-900 dark:text-white",
            socialButtonsBlockButtonText: "text-slate-900 dark:text-white font-semibold flex-1 text-center",
            formButtonPrimary: "bg-[#16A34A] hover:bg-[#15803d] text-white font-bold h-11",
            formFieldInput: "bg-gray-50 dark:bg-[#08111f] border-gray-200 dark:border-gray-700 text-slate-900 dark:text-white focus:border-[#16A34A] h-11",
            formFieldLabel: "text-slate-700 dark:text-gray-300 font-medium",
            footerActionText: "text-slate-500 dark:text-gray-400",
            footerActionLink: "text-[#16A34A] hover:text-[#15803d] font-semibold",
            dividerLine: "bg-gray-200 dark:bg-gray-800",
            dividerText: "text-slate-400 dark:text-gray-500",
            identityPreview: "bg-gray-50 dark:bg-[#08111f] border border-gray-200 dark:border-gray-700",
            identityPreviewText: "text-slate-900 dark:text-white",
            identityPreviewEditButton: "text-[#16A34A] hover:text-[#15803d]",
          }
        }}
      >
        <UserPreferencesProvider>
          {inner}
        </UserPreferencesProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
