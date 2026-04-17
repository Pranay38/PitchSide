import { MongoClient } from 'mongodb';

async function check() {
    const uri = "mongodb+srv://PitchSide:T8A8EAVsvlTg1egz@cluster0.mqgk89r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('pitchside');
        let posts = await db.collection('posts').find({}).toArray();

        console.log(`Total posts: ${posts.length}`);
        let editorPicks = posts.filter(p => p.editorPick);
        console.log(`Posts with editorPick=true: ${editorPicks.length}`);
        
        let mustReads = posts.filter(p => p.mustRead);
        console.log(`Posts with mustRead=true: ${mustReads.length}`);

        if (editorPicks.length > 0) {
            console.log("Editor Pick Titles:");
            editorPicks.forEach(p => console.log(`- ${p.title}`));
        }
    } finally {
        await client.close();
    }
}
check().catch(console.error);
