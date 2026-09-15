const { MongoClient } = require("mongodb");

async function run() {
  const uri = "mongodb+srv://PitchSide:wU6z4FM7kIo2us8c@cluster0.mqgk89r.mongodb.net/?appName=Cluster0";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("pitchside");
    
    console.log("Checking posts...");
    const posts = await db.collection("posts").find({
      $or: [
        { _id: "1788206781570" },
        { _id: "1788207102941" }
      ]
    }).toArray();
    
    posts.forEach(p => {
      console.log(`\n--- POST ${p._id} ---`);
      console.log(`Title: ${p.title}`);
      console.log(`Snippet: ${p.content.substring(0, 500)}`);
    });
    
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
