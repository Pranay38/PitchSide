import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import { applyCors, checkRateLimit } from "../utils/security.js";

const ADMIN_PASSWORD = process.env.VITE_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || "pitchside2026";
const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_do_not_use_in_prod";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);

    // Rate limiting (Stricter defaults here, e.g. 10 requests per minute to prevent brute-force)
    process.env.RATE_LIMIT_MAX_REQUESTS = "10";
    if (!checkRateLimit(req, res)) return;

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { password } = req.body;

        if (!password || password !== ADMIN_PASSWORD) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        // Generate a token valid for 7 days
        const token = jwt.sign({ role: "admin" }, JWT_SECRET, { expiresIn: "7d" });

        return res.status(200).json({ success: true, token });
    } catch (error: any) {
        console.error("Auth API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
