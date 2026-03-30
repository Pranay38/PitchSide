import { connectToDatabase } from "../_db";
import { ObjectId } from "mongodb";
import { config } from "dotenv";
config({ path: ".env.production.local" });

async function run() {
    console.log("Connecting to database...");
    const { db, client } = await connectToDatabase();
    const collection = db.collection("posts");

    console.log("Fetching posts without slugs...");
    const posts = await collection.find({ slug: { $exists: false } }).toArray();
    console.log(`Found ${posts.length} posts to backfill.`);

    let updatedCount = 0;

    for (const post of posts) {
        if (!post.title) {
            console.log(`Skipping post ${post._id} (No title)`);
            continue;
        }

        const idStr = String(post.id || post._id);
        const baseSlug = post.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const slug = `${baseSlug}-${idStr.slice(-5)}`;

        await collection.updateOne(
            { _id: post._id },
            { $set: { slug } }
        );

        console.log(`Updated: ${idStr} -> ${slug}`);
        updatedCount++;
    }

    console.log(`\nBackfill complete! Updated ${updatedCount} posts.`);
    await client.close();
}

run().catch(err => {
    console.error("Backfill failed:", err);
    process.exit(1);
});
