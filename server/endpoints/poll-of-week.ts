import type { VercelRequest, VercelResponse } from "@vercel/node";
import { connectToDatabase } from "../_db";
import { applyCors, checkRateLimit } from "../utils/security";

const COLLECTION = "settings";
const SETTINGS_ID = "site-settings";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollOfWeek {
  id: string;
  enabled: boolean;
  title: string;
  description: string;
  question: string;
  options: PollOption[];
  updatedAt: string;
}

interface SiteSettingsDoc {
  _id: string;
  pollOfWeek?: Partial<PollOfWeek>;
}

function normalizePollOfWeek(input?: Partial<PollOfWeek> | null): PollOfWeek {
  const options = (Array.isArray(input?.options) ? input!.options : [])
    .slice(0, 5)
    .map((option, index) => ({
      id: String(option?.id || `option-${index + 1}`),
      text: String(option?.text || ""),
      votes: Math.max(0, Math.round(Number(option?.votes || 0))),
    }));

  while (options.length < 2) {
    options.push({
      id: `option-${options.length + 1}`,
      text: "",
      votes: 0,
    });
  }

  return {
    id: String(input?.id || ""),
    enabled: input?.enabled ?? false,
    title: String(input?.title || "Poll of the Week"),
    description: String(input?.description || ""),
    question: String(input?.question || ""),
    options,
    updatedAt: String(input?.updatedAt || ""),
  };
}

function getFilledOptions(options: PollOption[]): PollOption[] {
  return options.filter((option) => option.text.trim().length > 0);
}

function isActivePoll(poll: PollOfWeek): boolean {
  return poll.enabled && poll.question.trim().length > 0 && getFilledOptions(poll.options).length >= 2;
}

function publicPollPayload(poll: PollOfWeek): PollOfWeek {
  return {
    ...poll,
    options: getFilledOptions(poll.options),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  applyCors(req, res);
  if (!checkRateLimit(req, res)) return;

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection<SiteSettingsDoc>(COLLECTION);

    if (req.method === "GET") {
      const doc = await collection.findOne({ _id: SETTINGS_ID });
      const poll = normalizePollOfWeek(doc?.pollOfWeek);

      if (!isActivePoll(poll)) {
        return res.status(404).json({ error: "No active poll." });
      }

      return res.status(200).json(publicPollPayload(poll));
    }

    if (req.method === "POST") {
      const pollId = String(req.body?.pollId || "").trim();
      const optionId = String(req.body?.optionId || "").trim();
      if (!pollId || !optionId) {
        return res.status(400).json({ error: "pollId and optionId are required." });
      }

      const doc = await collection.findOne({ _id: SETTINGS_ID });
      const poll = normalizePollOfWeek(doc?.pollOfWeek);

      if (!isActivePoll(poll)) {
        return res.status(404).json({ error: "No active poll." });
      }

      if (poll.id !== pollId) {
        return res.status(409).json({ error: "Poll has changed. Refresh and try again." });
      }

      const optionIndex = poll.options.findIndex((option) => option.id === optionId && option.text.trim().length > 0);
      if (optionIndex === -1) {
        return res.status(400).json({ error: "Invalid poll option." });
      }

      const timestamp = new Date().toISOString();
      const nextPoll: PollOfWeek = {
        ...poll,
        options: poll.options.map((option, index) => (
          index === optionIndex
            ? { ...option, votes: option.votes + 1 }
            : option
        )),
        updatedAt: timestamp,
      };

      await collection.updateOne(
        { _id: SETTINGS_ID },
        { $set: { pollOfWeek: nextPoll, updatedAt: timestamp } },
        { upsert: true },
      );

      return res.status(200).json(publicPollPayload(nextPoll));
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    console.error("Poll Of The Week API Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
}
