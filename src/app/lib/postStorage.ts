import type { BlogPost } from "../data/posts";
import { blogPosts as defaultPosts } from "../data/posts";

const POSTS_KEY = "pitchside_posts";
const ADMIN_KEY = "pitchside_admin_auth";

// Admin password — change this to your desired password
const ADMIN_PASSWORD = "pitchside2026";

// API base URL — in production (Vercel) this is the same domain
const API_BASE = "/api";

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

/**
 * Get all posts. Tries API first, falls back to localStorage.
 */
export async function getAllPostsAsync(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE}/posts`);
    if (res.ok) {
      const posts = await res.json();
      if (Array.isArray(posts) && posts.length > 0) {
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

function getAllPostsLocal(): BlogPost[] {
  try {
    const stored = localStorage.getItem(POSTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as BlogPost[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  savePostsLocal(defaultPosts);
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
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(post),
    });
    if (res.ok) {
      return getAllPostsAsync();
    }
  } catch {
    // fall through
  }
  // localStorage fallback
  return addPostLocal(post);
}

export function addPost(post: Omit<BlogPost, "id">): BlogPost[] {
  return addPostLocal(post);
}

function addPostLocal(post: Omit<BlogPost, "id">): BlogPost[] {
  const posts = getAllPostsLocal();
  const newPost: BlogPost = { ...post, id: Date.now().toString() };
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
  try {
    const res = await fetch(`${API_BASE}/posts`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    if (res.ok) {
      return getAllPostsAsync();
    }
  } catch {
    // fall through
  }
  return updatePostLocal(id, updates);
}

export function updatePost(id: string, updates: Partial<BlogPost>): BlogPost[] {
  return updatePostLocal(id, updates);
}

function updatePostLocal(id: string, updates: Partial<BlogPost>): BlogPost[] {
  const posts = getAllPostsLocal();
  const updated = posts.map((p) => (p.id === id ? { ...p, ...updates } : p));
  savePostsLocal(updated);
  return updated;
}

/**
 * Delete a post. Sends to API, falls back to localStorage.
 */
export async function deletePostAsync(id: string): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_BASE}/posts?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      return getAllPostsAsync();
    }
  } catch {
    // fall through
  }
  return deletePostLocal(id);
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
  try {
    return localStorage.getItem(ADMIN_KEY) === "true";
  } catch {
    return false;
  }
}

export function adminLogin(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    try {
      localStorage.setItem(ADMIN_KEY, "true");
    } catch {
      // ignore
    }
    return true;
  }
  return false;
}

export function adminLogout(): void {
  try {
    localStorage.removeItem(ADMIN_KEY);
  } catch {
    // ignore
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
