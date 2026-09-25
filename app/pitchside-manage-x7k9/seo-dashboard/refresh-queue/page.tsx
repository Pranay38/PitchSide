import { getPublishedPostsServer } from "@/lib/server-data";
import RefreshQueueClient from "./RefreshQueueClient";

export const metadata = {
  title: "SEO Refresh Queue | Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function RefreshQueuePage() {
  const posts = await getPublishedPostsServer();
  return <RefreshQueueClient posts={posts} />;
}
