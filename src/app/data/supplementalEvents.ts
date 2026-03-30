/**
 * Supplemental events for the "On This Day" feature.
 * Manually curated events that enrich the on-this-day timeline.
 */

export interface SupplementalEvent {
  id: string;
  date: string; // MM-DD format
  year: number;
  title: string;
  description: string;
  category?: string;
  imageUrl?: string;
}

export const supplementalEvents: SupplementalEvent[] = [];
