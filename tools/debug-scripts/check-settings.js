import { MongoClient } from 'mongodb';

async function check() {
    const uri = "mongodb+srv://PitchSide:T8A8EAVsvlTg1egz@cluster0.mqgk89r.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
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
