import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db.js";
import { applyCors, checkRateLimit, requireAuth } from "../utils/security.js";

interface Fixture {
  opp: string;
  h: boolean;
  diff: 1 | 2 | 3;
}

interface TitleRaceTeam {
  id: string;
  name: string;
  short: string;
  color: string;
  pts: number;
  played: number;
  gd: number;
  w: number;
  d: number;
  l: number;
  form: string[];
  remaining: Fixture[];
  verdict: string;
}

interface TitleRaceData {
  configId: string;
  teams: TitleRaceTeam[];
  updatedAt: string;
}

function getDefaultData(): TitleRaceData {
  return {
    configId: "default",
    updatedAt: new Date().toISOString(),
    teams: []
  };
}

export default async function titleRaceHandler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  // Disabled rate limiting check if it doesn't exist or modify appropriately based on Pitchside logic
  // if (!checkRateLimit(req, res)) return;

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<TitleRaceData>("title_race");

    if (req.method === "GET") {
      const data = await collection.findOne({ configId: "default" });
      if (!data) {
        return res.status(200).json(getDefaultData());
      }
      
      if (data.teams && Array.isArray(data.teams)) {
        data.teams.sort((a, b) => b.pts - a.pts || b.gd - a.gd);
      }
      return res.status(200).json(data);
    }

    if (req.method === "PUT") {
      if (!requireAuth(req, res)) return;
      
      const { teams } = req.body || {};
      if (!Array.isArray(teams)) {
        return res.status(400).json({ error: "Teams must be an array" });
      }

      const newData: TitleRaceData = {
        configId: "default",
        teams,
        updatedAt: new Date().toISOString(),
      };

      await collection.updateOne(
        { configId: "default" },
        { $set: newData },
        { upsert: true }
      );

      return res.status(200).json({ success: true, data: newData });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error: any) {
    console.error("Title Race API Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
