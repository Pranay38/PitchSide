import type { BlogPost } from "../data/posts";
export function articleShareUrl(
  post: Pick<BlogPost, "id" | "slug">,
  source: string,
  content: string,
  origin = "https://www.thetouchlinedribble.in",
): string {
  const url = new URL(`/post/${post.slug || post.id}`, origin);
  url.search = new URLSearchParams({
    utm_source: source,
    utm_medium: "social",
    utm_campaign: post.slug || post.id,
    utm_content: content,
  }).toString();
  return url.toString();
}
