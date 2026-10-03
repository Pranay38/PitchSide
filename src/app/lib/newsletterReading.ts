import type { BlogPost } from "../data/posts";
import { isOpinion, isExplainer, publishedPosts } from "./matchdayContent";

export const NEWSLETTER_PROMISE = "One strong football opinion and one useful lesson, every week.";
export function newsletterReading(posts: BlogPost[]) {
  const available = publishedPosts(posts).filter(p => !(p.gatekeepPoint && p.gatekeepPoint > 0));
  const opinions = available.filter(isOpinion);
  const opinion = opinions.find(p => p.editorPick || p.mainStory) || opinions[0];
  const explainers = available.filter(isExplainer);
  const explainer = explainers.find(p => p.id === opinion?.editorial?.backgroundPostId)
    || explainers.find(p => p.editorPick) || explainers[0];
  const link = (post?: BlogPost) => post ? {
    href: `/post/${encodeURIComponent(post.slug || post.id)}`,
    title: post.title,
    excerpt: post.excerpt || "",
    date: post.publishAt || post.date,
  } : undefined;
  return { opinion: link(opinion), explainer: link(explainer) };
}
