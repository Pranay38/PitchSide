import { MongoClient } from 'mongodb';

async function check() {
    const uri = "mongodb+srv://PitchSide:T8A8EAVsvlTg1egz@cluster0.mqgk89r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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
