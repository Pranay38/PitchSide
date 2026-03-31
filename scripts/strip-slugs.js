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
    console.log(`Found ${posts.length} post(s) to process.`);

    let updated = 0;
    for (const post of posts) {
      // In the backend logic, we used: id = req.body.id || id parsed from URL.
      // But _api/posts.ts does: const baseSlug = ...; postData.slug = `${baseSlug}-${id.slice(-5)}`;
      // So the id was whatever was passed to it.
      // Let's just find where "-<digits>" is at the end.
      
      const slugMatch = post.slug.match(/^(.*)-([0-9a-fA-F]{1,5})$/);
      if (slugMatch) {
         const newSlug = slugMatch[1];
         let finalSlug = newSlug;
         let counter = 1;
         while (await collection.findOne({ slug: finalSlug, _id: { $ne: post._id } })) {
            finalSlug = `${newSlug}-${counter}`;
            counter++;
         }
         await collection.updateOne({ _id: post._id }, { $set: { slug: finalSlug } });
         console.log(`Updated: ${post.slug} -> ${finalSlug}`);
         updated++;
      }
    }
    
    console.log(`Finished. Updated ${updated} posts.`);
  } catch (error) {
    console.error(error);
  } finally {
    await client.close();
  }
}

run();
