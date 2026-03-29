/**
 * Web Vitals — reports Core Web Vitals (LCP, FID, CLS, INP, TTFB) to Google Analytics 4.
 * Import and call this once from main.tsx.
 */
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from "web-vitals";

function sendToGA4(metric: Metric) {
  // Send to GA4 as an event
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", metric.name, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      non_interaction: true,
    });
  }
}

export function reportWebVitals() {
  onCLS(sendToGA4);
  onINP(sendToGA4);
  onLCP(sendToGA4);
  onFCP(sendToGA4);
  onTTFB(sendToGA4);
}
