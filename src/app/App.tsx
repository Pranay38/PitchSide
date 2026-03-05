import { RouterProvider } from "react-router";
import { HelmetProvider } from "react-helmet-async";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { OfflineIndicator } from "./components/OfflineIndicator";

export default function App() {
  return (
    <HelmetProvider>
      <OfflineIndicator />
      <RouterProvider router={router} />
      <PWAInstallPrompt />
      <Toaster />
    </HelmetProvider>
  );
}
