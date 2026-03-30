import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security";

/**
 * Interface for a remaining fixture
 */
interface Fixture {
  id: string; // e.g. "ars_liv"
  opponent: string; // e.g. "LIV"
  isHome: boolean;
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = Easiest, 5 = Hardest
}

/**
 * Interface for a team's run-in data
 */
interface RunInTeamData {
  id: string; // e.g. "mid_title_race_ars"
  teamName: string; // e.g. "Arsenal"
  logoHash: string; // e.g. url or local path
  currentPoints: number;
  goalDifference: number;
  fixtures: Fixture[];
  rank: number;
}

/**
 * Interface for the entire Run-In configuration
 */
interface RunInConfig {
  _id?: string;
  configId: string; // Always 'default' for now
  title: string; // e.g. "Premier League Title Race"
  description: string; // e.g. "The run-in for the 24/25 season."
  teams: RunInTeamData[];
  updatedAt: string;
}

/**
 * Helper to get the default, empty run-in data
 */
function getDefaultRunInData(): RunInConfig {
  return {
    configId: "default",
    title: "Premier League Title Race",
    description: "The remaining fixtures for the top contenders.",
    updatedAt: new Date().toISOString(),
    teams: [],
  };
}

export default async function runInHandler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  if (!checkRateLimit(req, res)) return;

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<RunInConfig>("run_in_tracker");

    // GET: Fetch the run-in data
    if (req.method === "GET") {
      const config = await collection.findOne({ configId: "default" });

      if (!config) {
        return res.status(200).json(getDefaultRunInData());
      }

      return res.status(200).json(config);
    }

    // PUT: Update the run-in data (Admin Only)
    if (req.method === "PUT") {
      if (!requireAuth(req, res)) return;

      const { title, description, teams } = req.body || {};

      if (!Array.isArray(teams)) {
        return res.status(400).json({ error: "Teams must be an array" });
      }

      const newConfig: RunInConfig = {
        configId: "default",
        title: title || "Title Race",
        description: description || "",
        teams,
        updatedAt: new Date().toISOString(),
      };

      await collection.updateOne(
        { configId: "default" },
        { $set: newConfig },
        { upsert: true },
      );

      return res.status(200).json({ success: true, data: newConfig });
    }

    // Any other method
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error: any) {
    console.error("Run-In API Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
