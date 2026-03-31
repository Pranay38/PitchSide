/**
 * One-time migration script to backfill slugs for published posts that lack them.
 *
 * Usage:
 *   node scripts/backfill-slugs.js            # dry-run (shows what would change)
 *   node scripts/backfill-slugs.js --apply    # actually write to DB
 */
const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = (process.env.MONGODB_URI || "").replace(/\\n$/g, "").replace(/\n$/g, "").trim();
const MONGODB_DB = process.env.MONGODB_DB || "pitchside";
const DRY_RUN = !process.argv.includes("--apply");

function toSlug(title, id) {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return `${baseSlug}-${id.slice(-5)}`;
}

async function main() {
  if (DRY_RUN) {
    console.log("🔍 DRY RUN — pass --apply to actually write changes\n");
  }

  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db(MONGODB_DB);
  const collection = db.collection("posts");

  // Find all posts that are published (isDraft != true) and have no slug
  const postsWithoutSlug = await collection
    .find({
      $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
    })
    .toArray();

  console.log(`Found ${postsWithoutSlug.length} post(s) without a slug:\n`);

  let updated = 0;
  for (const post of postsWithoutSlug) {
    const postId = post.id || String(post._id);
    const title = post.title;
    if (!title || title === "Untitled Draft") {
      console.log(`  ⏭️  Skipping "${title || "(no title)"}" [${postId}]`);
      continue;
    }

    const slug = toSlug(title, postId);
    console.log(`  📝 "${title}"`);
    console.log(`      id:   ${postId}`);
    console.log(`      slug: ${slug}`);

    if (!DRY_RUN) {
      await collection.updateOne(
        { _id: post._id },
        { $set: { slug } }
      );
      console.log(`      ✅ Updated!`);
    }
    updated++;
  }

  console.log(
    `\n${DRY_RUN ? "Would update" : "Updated"} ${updated} post(s).`
  );

  await client.close();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
