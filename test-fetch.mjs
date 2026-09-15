import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("No MONGODB_URI found");
    return;
  }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("touchlinedribble");
  const post = await db.collection("posts").findOne({ gatekeepPoint: { $exists: true } });
  console.log("Post with gatekeepPoint:", post ? {
    id: post.id || post._id,
    title: post.title,
    gatekeepPoint: post.gatekeepPoint,
    typeofGatekeepPoint: typeof post.gatekeepPoint
  } : "None found");
  
  const anyPost = await db.collection("posts").findOne({});
  console.log("Any post:", anyPost ? {
    id: anyPost.id || anyPost._id,
    title: anyPost.title,
    gatekeepPoint: anyPost.gatekeepPoint
  } : "None found");
  
  await client.close();
}
run().catch(console.error);
