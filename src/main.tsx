
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { initializePosts } from "./app/lib/postStorage";
import { reportWebVitals } from "./app/lib/webVitals";

// Load posts in the background without blocking the render
initializePosts().catch(console.error);

createRoot(document.getElementById("root")!).render(<App />);

// Report Core Web Vitals to GA4 (non-blocking)
reportWebVitals();