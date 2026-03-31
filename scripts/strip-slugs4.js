const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = (process.env.MONGODB_URI || "").replace(/\\n$/g, "").replace(/\n$/g, "").trim();
const MONGODB_DB = process.env.MONGODB_DB || "pitchside";

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const collection = db.collection("posts");
    
    const posts = await collection.find({ slug: { $exists: true, $ne: null } }).toArray();

    for (const post of posts) {
      if (!post.slug) continue;
      
      const idStr = String(post.id || post._id);
      console.log(`idStr: ${idStr}, slug: ${post.slug}`);
      
      const matchPattern1 = new RegExp(`-${idStr.slice(-5)}$`);
      const matchPattern2 = new RegExp(`-${idStr}$`);
      
      const match1 = post.slug.match(matchPattern1);
      const match2 = post.slug.match(matchPattern2);
      
      if (match1) {
        console.log(`   MATCHED -5: ${match1[0]}`);
      } else if (match2) {
        console.log(`   MATCHED full: ${match2[0]}`);
      } else {
        const slugMatch = post.slug.match(/-([0-9a-fA-F]{1,5})$/);
        if (slugMatch) {
            console.log(`   Hmm matches numbers at end but not id: ${slugMatch[1]}`);
        } else {
            console.log(`   NO match`);
        }
      }
    }
  } catch(e) { console.log(e); } finally {
    await client.close();
  }
}

run();
