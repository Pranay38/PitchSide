import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("No MONGODB_URI found");
    return;
  }
  const dbName = process.env.MONGODB_DB || "pitchside";
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  
  const post = await db.collection("posts").findOne({ gatekeepPoint: { $exists: true } });
  console.log("Post with gatekeepPoint:", post ? {
    id: post.id || post._id,
    title: post.title,
    gatekeepPoint: post.gatekeepPoint,
    typeofGatekeepPoint: typeof post.gatekeepPoint
  } : "None found");
  
  await client.close();
}
run().catch(console.error);
