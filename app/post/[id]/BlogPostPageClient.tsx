"use client";

import { BlogPostPage as BlogPostPageOriginal } from "@/app/pages/BlogPostPage";

interface BlogPostPageClientProps {
  postId: string;
  initialPost: any;
}

export function BlogPostPageClient({ postId, initialPost }: BlogPostPageClientProps) {
  return <BlogPostPageOriginal />;
}
