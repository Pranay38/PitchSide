export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function deslugify(value: string): string {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function topicPath(topic: string): string {
  return `/topic/${slugify(topic)}`;
}

export function postPath(post: { id: string; slug?: string }): string {
  return `/post/${post.slug || post.id}`;
}
