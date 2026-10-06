import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../server/_db";
import { verifyUnsubscribeToken } from "../../../server/utils/unsubscribe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'" };
function page(message: string, token?: string) {
  return new NextResponse(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Newsletter preferences</title></head><body style="font-family:system-ui,sans-serif;max-width:36rem;margin:60px auto;padding:24px;line-height:1.6"><h1>The Weekly Whistle</h1><p>${message}</p>${token ? `<form method="post" action="/api/unsubscribe?token=${encodeURIComponent(token)}"><input type="hidden" name="List-Unsubscribe" value="One-Click"><button style="padding:12px 18px;font:inherit" type="submit">Unsubscribe</button></form>` : ""}</body></html>`, { headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
}
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token") || "";
    if (!verifyUnsubscribeToken(token)) return new NextResponse("Invalid unsubscribe link.", { status: 400, headers });
    return page("Unsubscribe from The Weekly Whistle and article emails? You can confirm below.", token);
  } catch {
    return new NextResponse("Unsubscribe is temporarily unavailable. Please try again later.", { status: 503, headers });
  }
}
export async function POST(request: NextRequest) {
  try {
    const email = verifyUnsubscribeToken(request.nextUrl.searchParams.get("token") || "");
    const form = await request.formData().catch(() => null);
    if (!email || form?.get("List-Unsubscribe") !== "One-Click") return new NextResponse("Invalid unsubscribe request.", { status: 400, headers });
    const { db } = await connectToDatabase();
    await db.collection("subscribers").updateOne({ email, status: { $ne: "unsubscribed" } }, { $set: {
      status: "unsubscribed", unsubscribedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      "preferences.digest": false, "preferences.newArticles": false, "preferences.productUpdates": false,
    } });
    return page("You’re unsubscribed. You won’t receive further newsletter or article emails. An email already in transit may still arrive.");
  } catch {
    return new NextResponse("Could not save your preference. Please try again later.", { status: 503, headers });
  }
}
