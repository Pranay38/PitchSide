/**
 * Google Analytics 4 — SPA page-view tracking.
 *
 * Because this is a single-page app, GA4's default "page_view" on script load
 * only fires once. We disable the automatic page_view in index.html
 * (send_page_view: false) and instead send a page_view event every time
 * React Router navigates.
 *
 * Usage: call `trackPageView()` in a router subscriber (see routes.tsx).
 */

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID as string | undefined;

/** Send a GA4 page_view event for the current URL. */
export function trackPageView(url?: string) {
  if (!GA_ID || !window.gtag) return;
  window.gtag("config", GA_ID, {
    page_path: url ?? window.location.pathname + window.location.search,
  });
}
