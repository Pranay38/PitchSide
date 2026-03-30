import { getPostByIdServer } from "./src/lib/server-data";
import { connectToDatabase } from "./src/lib/server-data";

async function run() {
  process.env.MONGODB_URI = "mongodb+srv://dribbleadmin:Hahw13fJ2xY3cR4Z@cluster0.z5i6s.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // I fetched this from .env.local earlier 
  const p = await getPostByIdServer("1774786278073");
  console.log("Post slug is:", p?.slug);
  console.log("Post ID is:", p?.id);
  process.exit(0);
}

run();
