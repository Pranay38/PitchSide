import type { VercelRequest, VercelResponse } from "@vercel/node";
import jwt from "jsonwebtoken";
import { applyCors } from "../utils/security";
import { createClerkClient } from "@clerk/backend";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_dev_secret_do_not_use_in_prod";
const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const ADMIN_SESSION_COOKIE = "pitchside_admin_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function buildAdminSessionCookie(req: VercelRequest, token: string, maxAge: number) {
    const forwardedProto = (req.headers["x-forwarded-proto"] as string | undefined)?.split(",")[0]?.trim();
    const host = req.headers.host || "";
    const secure = forwardedProto === "https" || !host.includes("localhost");

    return [
        `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(token)}`,
        `Max-Age=${maxAge}`,
        "Path=/",
        "HttpOnly",
        "SameSite=Lax",
        secure ? "Secure" : "",
    ]
        .filter(Boolean)
        .join("; ");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    applyCors(req, res);
    res.setHeader("Cache-Control", "private, no-store, max-age=0, must-revalidate");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    if (req.method !== "POST") {
        if (req.method === "DELETE") {
            res.setHeader("Set-Cookie", buildAdminSessionCookie(req, "", 0));
            return res.status(200).json({ success: true });
        }
        return res.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { clerkToken } = req.body;

        if (!clerkToken) {
            return res.status(401).json({ error: "Missing Clerk token" });
        }

        // Verify Clerk token cryptographically
        const decoded = await clerkClient.verifyToken(clerkToken);
        const userId = decoded.sub;

        // Fetch user from Clerk to get the primary email address
        const user = await clerkClient.users.getUser(userId);
        const primaryEmail = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
        const emailAddress = primaryEmail?.emailAddress?.trim().toLowerCase() || "";

        // Strictly match against the required admin email
        const allowedEmails = ["pranayagrawal382@gmail.com", "pranayagarwal382@gmail.com"];
        if (!allowedEmails.includes(emailAddress)) {
            return res.status(403).json({ error: "Unauthorized: Admin access is restricted to Pranay's email." });
        }

        // Generate our pitchside admin JWT token valid for 7 days
        const token = jwt.sign({ role: "admin", email: emailAddress }, JWT_SECRET, { expiresIn: "7d" });
        res.setHeader("Set-Cookie", buildAdminSessionCookie(req, token, ADMIN_SESSION_MAX_AGE));

        return res.status(200).json({ success: true, token });
    } catch (error: any) {
        console.error("Auth API Error:", error);
        return res.status(500).json({ error: error.message || "Internal server error" });
    }
}
