"use client";
import { Link } from "@/lib/router-compat";
import type { BlogPost } from "../data/posts";
import { trackContentEvent } from "../lib/analytics";
type ReadingLink = Pick<BlogPost, "id" | "slug" | "title">;
export function EditorialReading({
  postId,
  background,
  perspective,
}: {
  postId: string;
  background?: ReadingLink;
  perspective?: ReadingLink;
}) {
  const links = [
    { post: background, label: "Understand the background" },
    { post: perspective, label: "Another perspective" },
  ].filter((item) => item.post);
  if (!links.length) return null;
  return (
    <nav
      aria-label="Continue reading"
      className="my-10 grid gap-4 sm:grid-cols-2"
    >
      {links.map((item) => (
        <Link
          key={item.label}
          to={`/post/${item.post!.slug || item.post!.id}`}
          className="rounded-2xl border border-border p-5 hover:bg-secondary transition-colors"
          onClick={() =>
            trackContentEvent("related_article_click", {
              article_id: postId,
              destination_article_id: item.post!.id,
              placement: item.label,
            })
          }
        >
          <p className="text-xs font-bold uppercase tracking-widest text-primary">
            {item.label}
          </p>
          <p className="font-headline text-xl mt-3">{item.post!.title}</p>
        </Link>
      ))}
    </nav>
  );
}
