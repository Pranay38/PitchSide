import { MongoClient } from 'mongodb';

async function check() {
    const uri = "mongodb+srv://user:pass@cluster.mongodb.net/test";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('pitchside');
        let posts = await db.collection('posts').find({}).toArray();
        // Sort by date descending (assuming publishAt or similar)
        posts.sort((a, b) => new Date(b.publishAt || b.createdAt).getTime() - new Date(a.publishAt || a.createdAt).getTime());

        const mustReads = posts.filter((post) => post.mustRead);
        const flagged = posts.filter((post) => post.mainStory);
        const fallback = mustReads[0] || flagged[0] || posts[0] || null;
        console.log("Fallback Featured Post:", fallback?.title);
        
        const isEditorPickFallback = fallback?.editorPick;
        console.log("Is fallback post an Editor Pick?", isEditorPickFallback);
        
        let editorPicks = posts.filter(p => p.editorPick);
        console.log("All Editor Pick Titles:", editorPicks.map(p => p.title));
    } finally {
        await client.close();
    }
}
check().catch(console.error);
