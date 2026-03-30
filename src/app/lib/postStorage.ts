import type { BlogPost } from "../data/posts";
import { blogPosts as defaultPosts } from "../data/posts";
import { safeParseArray, BlogPostSchema } from "./schemas";

const POSTS_KEY = "pitchside_posts";
const ADMIN_KEY = "pitchside_admin_auth";

// API base URL — in production (Vercel) this is the same domain
const API_BASE = "/api";

// Helper to get JWT token
function getAuthToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_KEY);
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const [, payload] = token.split(".");
  if (!payload) return null;

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function generateDraftPreviewToken(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID().replace(/-/g, "");
    }
  } catch {
    // Fall back to a time/random token below.
  }

  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
}

// ──────────────────────────────────────────
// POSTS: API-first with localStorage fallback
// ──────────────────────────────────────────

/**
 * Check if the API is available (i.e., we're deployed on Vercel with MongoDB).
 */
async function isApiAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/posts`, { method: "OPTIONS" });
    return res.ok;
  } catch {
    return false;
  }
}

async function getApiErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = await res.json() as { error?: unknown; message?: unknown };
    if (typeof data.error === "string" && data.error.trim()) return data.error;
    if (typeof data.message === "string" && data.message.trim()) return data.message;
  } catch {
    // Ignore JSON parse issues and use fallback message.
  }
  return fallback;
}

function normalizePostRecord(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;

  const normalized = { ...(raw as Record<string, unknown>) };
  for (const key of ["previewToken", "publishAt", "mediaUrl", "sofascoreUrl", "playerName", "isDraft", "thisWeek", "mustRead", "editorPick", "mainStory"]) {
    if (normalized[key] === null) {
      delete normalized[key];
    }
  }

  return normalized;
}

/**
 * Get all posts. Tries API first, falls back to localStorage.
 * Validates each post with Zod — invalid entries are silently filtered out.
 */
export async function getAllPostsAsync(): Promise<BlogPost[]> {
  try {
    const token = getAuthToken();
    const res = await fetch(`${API_BASE}/posts`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (res.ok) {
      const raw = await res.json();
      const normalized = Array.isArray(raw) ? raw.map(normalizePostRecord) : raw;
      const posts = safeParseArray(BlogPostSchema, normalized) as BlogPost[];
      if (posts.length > 0) {
        // also cache in localStorage for offline
        savePostsLocal(posts);
        return posts;
      }
    }
  } catch {
    // API not available (local dev) — fall through to localStorage
  }
  return getAllPostsLocal();
}

/**
 * Sync version (reads localStorage only). Used for initial render.
 */
export function getAllPosts(): BlogPost[] {
  return getAllPostsLocal();
}

/**
 * Sync version. Only returns posts that are NOT marked as drafts.
 */
export function getPublishedPosts(): BlogPost[] {
  return getAllPostsLocal().filter(p => !p.isDraft);
}

/**
 * Async version. Only returns posts that are NOT marked as drafts.
 */
export async function getPublishedPostsAsync(): Promise<BlogPost[]> {
  const posts = await getAllPostsAsync();
  return posts.filter(p => !p.isDraft);
}

function getAllPostsLocal(): BlogPost[] {
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(POSTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as BlogPost[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {
    // ignore
  }
  if (typeof window !== 'undefined') {
    savePostsLocal(defaultPosts);
  }
  return defaultPosts;
}

function savePostsLocal(posts: BlogPost[]): void {
  try {
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
  } catch {
    // ignore
  }
}

/**
 * Add a new post. Sends to API, falls back to localStorage.
 */
export async function addPostAsync(
  post: Omit<BlogPost, "id">
): Promise<BlogPost[]> {
  if (!(await isApiAvailable())) {
    return addPostLocal(post);
  }

  const res = await fetch(`${API_BASE}/posts`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify(post),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      adminLogout();
      if (typeof window !== "undefined") window.location.reload();
    }
    throw new Error(await getApiErrorMessage(res, "Failed to publish post"));
  }

  const createdPost = await res.json();
  if (post.matchRatings && post.matchRatings.length > 0 && createdPost.id) {
    try {
      await fetch(`${API_BASE}/match-ratings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ postId: createdPost.id, ratings: post.matchRatings }),
      });
    } catch (e) {
      console.error("Failed to sync match ratings", e);
    }
  }

  return getAllPostsAsync();
}

export function addPost(post: Omit<BlogPost, "id">): BlogPost[] {
  return addPostLocal(post);
}

function addPostLocal(post: Omit<BlogPost, "id">): BlogPost[] {
  const posts = getAllPostsLocal();
  const newPost: BlogPost = {
    ...post,
    id: Date.now().toString(),
    previewToken: post.isDraft ? (post.previewToken || generateDraftPreviewToken()) : undefined,
  };
  const updated = [newPost, ...posts];
  savePostsLocal(updated);
  return updated;
}

/**
 * Update a post. Sends to API, falls back to localStorage.
 */
export async function updatePostAsync(
  id: string,
  updates: Partial<BlogPost>
): Promise<BlogPost[]> {
  if (!(await isApiAvailable())) {
    return updatePostLocal(id, updates);
  }

  const res = await fetch(`${API_BASE}/posts`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getAuthToken()}`
    },
    body: JSON.stringify({ id, ...updates }),
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      adminLogout();
      if (typeof window !== "undefined") window.location.reload();
    }
    throw new Error(await getApiErrorMessage(res, "Failed to update post"));
  }

  if (updates.matchRatings && updates.matchRatings.length > 0) {
    try {
      await fetch(`${API_BASE}/match-ratings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${getAuthToken()}`
        },
        body: JSON.stringify({ postId: id, ratings: updates.matchRatings }),
      });
    } catch (e) {
      console.error("Failed to sync match ratings", e);
    }
  }

  return getAllPostsAsync();
}

export function updatePost(id: string, updates: Partial<BlogPost>): BlogPost[] {
  return updatePostLocal(id, updates);
}

function updatePostLocal(id: string, updates: Partial<BlogPost>): BlogPost[] {
  const posts = getAllPostsLocal();
  const updated = posts.map((p) => {
    if (p.id !== id) return p;

    const next = { ...p, ...updates };
    if (next.isDraft) {
      next.previewToken = next.previewToken || generateDraftPreviewToken();
    } else if (updates.isDraft === false) {
      next.previewToken = undefined;
    }
    return next;
  });
  savePostsLocal(updated);
  return updated;
}

/**
 * Delete a post. Sends to API, falls back to localStorage.
 */
export async function deletePostAsync(id: string): Promise<BlogPost[]> {
  if (!(await isApiAvailable())) {
    return deletePostLocal(id);
  }

  const res = await fetch(`${API_BASE}/posts?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${getAuthToken()}`
    }
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      adminLogout();
      if (typeof window !== "undefined") window.location.reload();
    }
    throw new Error(await getApiErrorMessage(res, "Failed to delete post"));
  }

  return getAllPostsAsync();
}

export function deletePost(id: string): BlogPost[] {
  return deletePostLocal(id);
}

function deletePostLocal(id: string): BlogPost[] {
  const posts = getAllPostsLocal();
  const updated = posts.filter((p) => p.id !== id);
  savePostsLocal(updated);
  return updated;
}

/**
 * Get a single post by ID.
 */
export function getPostById(id: string): BlogPost | undefined {
  return getAllPostsLocal().find((p) => p.id === id);
}

export async function getPostByIdAsync(id: string): Promise<BlogPost | undefined> {
  const posts = await getAllPostsAsync();
  return posts.find((p) => p.id === id);
}

// ──────────────────────────────────────────
// EXPORT / IMPORT (still useful as backup)
// ──────────────────────────────────────────

export function exportPostsAsJSON(): void {
  const posts = getAllPostsLocal();
  const blob = new Blob([JSON.stringify(posts, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "posts.json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importPostsFromJSON(file: File): Promise<BlogPost[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (Array.isArray(data)) {
          savePostsLocal(data);
          resolve(data);
        } else {
          reject(new Error("Invalid format"));
        }
      } catch {
        reject(new Error("Failed to parse JSON"));
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Initialize posts: try loading from API, fallback to localStorage.
 */
export async function initializePosts(): Promise<void> {
  try {
    const posts = await getAllPostsAsync();
    if (posts.length > 0) {
      savePostsLocal(posts);
    }
  } catch {
    // API not available, localStorage already has data
  }
}

// ──────────────────────────────────────────
// Admin authentication
// ──────────────────────────────────────────

export function isAdminAuthenticated(): boolean {
  const token = getAuthToken();
  if (!token) return false;

  const isJwt = token.split(".").length === 3;
  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

  // Outside localhost we only trust JWTs, not legacy raw-password fallback tokens.
  if (!isJwt) {
    if (!isLocalhost) {
      adminLogout();
      return false;
    }
    return true;
  }

  const payload = decodeJwtPayload(token);
  const exp = typeof payload?.exp === "number" ? payload.exp : Number(payload?.exp);

  if (!Number.isFinite(exp)) {
    adminLogout();
    return false;
  }

  if (exp * 1000 <= Date.now()) {
    adminLogout();
    return false;
  }

  return true;
}

// Updated to async to hit backend Auth API, with local dev fallback
export type AdminLoginResult = {
  ok: boolean;
  error?: string;
};

export async function adminLogin(password: string): Promise<AdminLoginResult> {
  try {
    const res = await fetch(`${API_BASE}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
      cache: "no-store",
      credentials: "same-origin",
    });

    if (res.ok) {
      const data = await res.json();
      if (data.token) {
        localStorage.setItem(ADMIN_KEY, data.token);
        return { ok: true };
      }
      return { ok: false, error: "Could not sign in right now." };
    }

    const fallbackMessage =
      res.status === 429
        ? "Too many login attempts. Please wait a minute and try again."
        : res.status === 401 || res.status === 403
          ? "Incorrect password"
          : "Could not sign in right now.";

    return { ok: false, error: await getApiErrorMessage(res, fallbackMessage) };
  } catch {
    // network error — API unreachable (likely local dev)
  }

  const isLocalDev =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (!isLocalDev) {
    return { ok: false, error: "Could not reach the admin login service." };
  }

  // Fallback: client-side check for local dev when API is unavailable
  const envPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;
  const expected = envPassword || "pitchside2026";
  if (password === expected) {
    // Store the password as a simple token for local dev auth headers
    localStorage.setItem(ADMIN_KEY, password);
    return { ok: true };
  }

  return { ok: false, error: "Incorrect password" };
}

export function adminLogout(): void {
  try {
    localStorage.removeItem(ADMIN_KEY);
  } catch {
    // ignore
  }

  if (typeof window !== "undefined") {
    void fetch(`${API_BASE}/auth`, {
      method: "DELETE",
      cache: "no-store",
      credentials: "same-origin",
    }).catch(() => {
      // Best-effort server logout for the admin session cookie.
    });
  }
}

/**
 * Calculate read time from content
 */
export function calculateReadTime(content: string): string {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  return `${minutes} min read`;
}

/**
 * Format today's date
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Convenience: save posts to localStorage.
 */
export function savePosts(posts: BlogPost[]): void {
  savePostsLocal(posts);
}
