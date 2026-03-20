import { RouterProvider } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { ClerkProvider } from "@clerk/clerk-react";
import { BackToTopButton } from "./components/BackToTopButton";
import { CookieBanner } from "./components/CookieBanner";

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

export default function App() {
  const inner = (
    <HelmetProvider>
      <OfflineIndicator />
      <RouterProvider router={router} />
      <PWAInstallPrompt />
      <Toaster />
      <BackToTopButton />
      <CookieBanner />
    </HelmetProvider>
  );

  // If no Clerk key is configured, render the app without auth (graceful fallback)
  if (!CLERK_KEY) return inner;

  return (
    <ClerkProvider publishableKey={CLERK_KEY}>
      {inner}
    </ClerkProvider>
  );
}
