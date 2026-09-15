const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

async function run() {
  const uri = process.env.MONGODB_URI;
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("pitchside");
    
    console.log("Checking posts...");
    const posts = await db.collection("posts").find({
      $or: [
        { title: { $regex: /false\s*9/i } },
        { content: { $regex: /false\s*9/i } },
        { title: { $regex: /faalse/i } },
        { content: { $regex: /faalse/i } }
      ]
    }).toArray();
    console.log(`Found ${posts.length} posts matching.`);
    posts.forEach(p => console.log(`- [${p.isDraft ? 'DRAFT' : 'PUB'}] ${p._id}: ${p.title}`));
    
    // Check if post-versions exist
    console.log("Checking post_versions...");
    const versions = await db.collection("post_versions").find({
      $or: [
        { "postData.title": { $regex: /false\s*9/i } },
        { "postData.content": { $regex: /false\s*9/i } },
        { "postData.title": { $regex: /faalse/i } },
        { "postData.content": { $regex: /faalse/i } }
      ]
    }).toArray();
    console.log(`Found ${versions.length} versions matching.`);
    versions.forEach(v => console.log(`- Version ${v.version} for postId ${v.postId}: ${v.postData.title}`));
    
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
