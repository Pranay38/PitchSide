const { MongoClient } = require("mongodb");
require("dotenv").config();

async function run() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);
    const result = await db.collection("on_this_day_cache").deleteMany({ cacheKey: "03-17" });
    console.log("Deleted", result.deletedCount, "cache entries for 03-17");
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
