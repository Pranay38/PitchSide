import { connectToDatabase } from "./server/_db.js";
async function clear() {
  const { db } = await connectToDatabase();
  await db.collection("on_this_day_cache").deleteMany({ cacheKey: "03-17" });
  console.log("Cleared cache for today");
  process.exit(0);
}
clear();
