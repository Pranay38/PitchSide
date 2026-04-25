import { MongoClient } from 'mongodb';

async function check() {
    const uri = "mongodb+srv://user:pass@cluster.mongodb.net/test";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('pitchside');
        let posts = await db.collection('posts').find({ editorPick: true }).toArray();
        for (let p of posts) {
            console.log(`Title: ${p.title} | isDraft: ${p.isDraft} | createdAt: ${p.createdAt}`);
        }
    } finally {
        await client.close();
    }
}
check().catch(console.error);
