const { MongoClient } = require("mongodb");

async function run() {
  const uri = "mongodb+srv://PitchSide:wU6z4FM7kIo2us8c@cluster0.mqgk89r.mongodb.net/?appName=Cluster0";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("pitchside");
    
    const posts = await db.collection("posts").find({
      $or: [
        { _id: "1788206781570" },
        { _id: "1788207102941" }
      ]
    }).toArray();
    
    for (const p of posts) {
      if (p.title === "Untitled Draft") {
        // extract title from content <h1>
        const h1Match = p.content.match(/<h1>.*?>(.*?)<\/.*?>/);
        let newTitle = h1Match ? h1Match[1].replace(/<[^>]+>/g, '') : "Recovered Draft (False 9)";
        if (newTitle.length > 50) newTitle = newTitle.substring(0, 50) + "...";
        
        await db.collection("posts").updateOne(
          { _id: p._id },
          { $set: { title: newTitle } }
        );
        console.log(`Updated post ${p._id} title to: ${newTitle}`);
      }
    }
    
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
