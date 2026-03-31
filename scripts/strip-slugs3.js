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
      let suffix = `-${idStr.slice(-5)}`;
      
      // Some scripts explicitly padded with 0s up to 5
      if (idStr.length < 5) {
          suffix = `-${idStr.slice(-5).padStart(5, '0')}`;
      }

      let matched = false;
      let newSlug = post.slug;
      
      if (post.slug.endsWith(suffix)) {
        newSlug = post.slug.slice(0, -suffix.length);
        matched = true;
      } else if (post.slug.endsWith(`-${idStr}`)) {
         newSlug = post.slug.slice(0, -(idStr.length + 1));
         matched = true;
      }
      
      if (matched && newSlug.length > 0) {
        let finalSlug = newSlug;
        let counter = 1;
        while (await collection.findOne({ slug: finalSlug, _id: { $ne: post._id } })) {
          finalSlug = `${newSlug}-${counter}`;
          counter++;
        }
        
        await collection.updateOne({ _id: post._id }, { $set: { slug: finalSlug } });
        console.log(`Updated: ${post.slug} -> ${finalSlug}`);
      }
    }
  } catch(e) { console.log(e); } finally {
    await client.close();
  }
}

run();
