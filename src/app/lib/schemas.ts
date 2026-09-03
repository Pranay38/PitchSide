/**
 * Zod schemas for all external data flows.
 * Provides runtime validation with safe defaults so bad data
 * degrades gracefully instead of crashing the UI.
 */
import { z } from "zod";

const nullableOptionalString = z.string().nullable().optional().transform((value) => value ?? undefined);
const nullableOptionalBoolean = z.boolean().nullable().optional().transform((value) => value ?? undefined);

// ── Daily Features (homepage sidebar) ──────────────────────────

export const OnThisDaySchema = z.object({
  year: z.string().default(""),
  event: z.string().default("A quiet day in football history."),
});

export const RumorMillSchema = z.object({
  text: z.string(),
  sentimentScore: z.number().min(0).max(100).default(50),
  punchyLine: z.string().optional(),
  playerImageUrl: z.string().optional(),
});

export const ManagerPressureSchema = z.object({
  name: z.string(),
  pressureScore: z.number().min(0).max(100),
});

export const DailyFeaturesSchema = z.object({
  lastUpdated: z.string().default(new Date().toISOString()),
  onThisDay: OnThisDaySchema.optional(),
  rumorMill: RumorMillSchema.optional(),
  managerPressure: z.array(ManagerPressureSchema).default([]),
});

export type ValidatedDailyFeatures = z.infer<typeof DailyFeaturesSchema>;

// ── Blog Post (from /api/posts) ────────────────────────────────

export const BlogPostSchema = z.object({
  id: z.string(),
  title: z.string().default("Untitled"),
  excerpt: z.string().default(""),
  content: z.string().default(""),
  coverImage: z.string().default(""),
  club: z.string().default(""),
  tags: z.array(z.string()).default([]),
  date: z.string().default(""),
  readTime: z.string().default(""),
  thisWeek: nullableOptionalBoolean,
  mustRead: nullableOptionalBoolean,
  editorPick: nullableOptionalBoolean,
  mainStory: nullableOptionalBoolean,
  mediaUrl: nullableOptionalString,
  sofascoreUrl: nullableOptionalString,
  sofascoreWidget: z.any().optional(),
  playerName: nullableOptionalString,
  audioUrl: nullableOptionalString,
  isDraft: nullableOptionalBoolean,
  slug: nullableOptionalString,
  previewToken: nullableOptionalString,
  publishAt: nullableOptionalString,
  poll: z.object({
    question: z.string(),
    options: z.array(z.object({ text: z.string(), votes: z.number() })),
  }).optional(),
  seriesName: nullableOptionalString,
  seriesOrder: z.number().optional(),
  reactions: z.record(z.string(), z.number()).optional(),
  likedBy: z.array(z.string()).optional(),
  author: z.string().optional(),
  format: z.enum(["article", "quick-take"]).optional(),

  hotTakes: z.array(z.object({
    id: z.string(),
    statement: z.string()
  })).optional(),
});

export type ValidatedBlogPost = z.infer<typeof BlogPostSchema>;

// ── User Preferences (from /api/user-prefs) ────────────────────

export const UserPreferencesSchema = z.object({
  userId: z.string().optional(),
  savedPosts: z.array(z.string()).default([]),
  followedClubs: z.array(z.string()).default([]),
  followedTags: z.array(z.string()).default([]),
  seenAlerts: z.array(z.string()).default([]),
  fanClub: z.object({
    name: z.string(),
    logoUrl: z.string().nullable(),
    league: z.string().optional(),
  }).nullable().default(null),
  newsletterOptIn: z.boolean().default(false),
  readingHistory: z.array(z.object({
    postId: z.string(),
    viewedAt: z.number(),
  })).default([]),
});

export type ValidatedUserPreferences = z.infer<typeof UserPreferencesSchema>;

// ── Transfer Entry (from site settings) ────────────────────────

export const TransferEntrySchema = z.object({
  player: z.string(),
  from: z.string().optional(),
  to: z.string().optional(),
  fee: z.string().optional(),
  window: z.string().optional(),
  window_type: z.string().optional(),
  season: z.string().optional(),
  tm_url: z.string().optional(),
  fpl_id: z.number().nullable().optional(),
  performance: z.string().nullable().optional(),
});

// ── Helpers ────────────────────────────────────────────────────

/**
 * Safely parse data with a Zod schema. Returns the parsed data on success,
 * or the provided fallback on failure (logging the error in dev).
 */
export function safeParse<T>(schema: z.ZodType<T>, data: unknown, fallback: T): T {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  if (typeof window !== "undefined" && window.location?.hostname === "localhost") {
    console.warn("[Zod] Validation failed, using fallback:", result.error.issues);
  }
  return fallback;
}

/**
 * Safely parse an array: filters out invalid items instead of rejecting everything.
 */
export function safeParseArray<T>(schema: z.ZodType<T>, data: unknown): T[] {
  if (!Array.isArray(data)) return [];
  const results: T[] = [];
  for (const item of data) {
    const r = schema.safeParse(item);
    if (r.success) results.push(r.data);
  }
  return results;
}
