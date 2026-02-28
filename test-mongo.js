import { MongoClient } from 'mongodb';

async function check() {
    const uri = "mongodb+srv://PitchSide:T8A8EAVsvlTg1egz@cluster0.mqgk89r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        // Default db is 'test' typically, but let's list all to be sure if 'test' isn't what Vercel used
        const db = client.db('test');
        let posts = await db.collection('posts').find({}).toArray();

        if (posts.length === 0) {
            console.log('No posts in test db. Trying "myFirstDatabase" or listing dbs...');
            const adminDb = client.db().admin();
            const info = await adminDb.listDatabases();
            console.log('Available DBs:', info.databases.map(d => d.name));
            // Just check all databases for a 'posts' collection
            for (const d of info.databases) {
                if (d.name === 'admin' || d.name === 'local') continue;
                const tempDb = client.db(d.name);
                posts = await tempDb.collection('posts').find({}).toArray();
                if (posts.length > 0) {
                    console.log(`Found ${posts.length} posts in db "${d.name}".`);
                    break;
                }
            }
        } else {
            console.log(`Found ${posts.length} posts in 'test' db.`);
        }

        if (posts.length > 0) {
            console.log('Sample post _id type:', typeof posts[0]._id, 'Value:', posts[0]._id, 'Constructor:', posts[0]._id.constructor.name);
            console.log('Sample post id type:', typeof posts[0].id, 'Value:', posts[0].id);
        } else {
            console.log('No posts found anywhere!');
        }
    } finally {
        await client.close();
    }
}
check().catch(console.error);
