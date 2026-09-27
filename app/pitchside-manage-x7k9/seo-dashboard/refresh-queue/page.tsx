import { getPublishedPostsServer } from "@/lib/server-data";
import RefreshQueueClient from "./RefreshQueueClient";
import type { BlogPost } from "@/app/data/posts";

export const metadata = {
  title: "SEO Refresh Queue | Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function RefreshQueuePage() {
  const posts = await getPublishedPostsServer() as BlogPost[];
  return <RefreshQueueClient posts={posts} />;
}
