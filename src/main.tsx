
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import { initializePosts } from "./app/lib/postStorage";

// Load posts from deployed posts.json (if available) before rendering
initializePosts().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});