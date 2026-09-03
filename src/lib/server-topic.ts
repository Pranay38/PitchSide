import { connectToDatabase } from "./server-data";

export interface TopicDetails {
  slug: string;
  title: string;
  description: string;
  heroImage?: string;
}

export async function getTopicBySlugServer(slug: string): Promise<TopicDetails | null> {
  try {
    const { db } = await connectToDatabase();
    const collection = db.collection("topics");

    const topic = await collection.findOne({ slug: slug.toLowerCase() });

    if (!topic) {
      return null;
    }

    const { _id, ...rest } = topic;
    return rest as TopicDetails;
  } catch (error) {
    console.error(`[server-topic] getTopicBySlugServer(${slug}) failed:`, error);
    return null;
  }
}
