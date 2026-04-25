import { MongoClient } from 'mongodb';

async function check() {
    const uri = "mongodb+srv://user:pass@cluster.mongodb.net/test";
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('pitchside');
        let settings = await db.collection('settings').findOne({});
        console.log(JSON.stringify(settings?.homepageCuration, null, 2));
    } finally {
        await client.close();
    }
}
check().catch(console.error);
