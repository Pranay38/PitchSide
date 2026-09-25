import { NextResponse } from "next/server";
import { notifyIndexNow } from "@/lib/indexnow";

export async function GET() {
  const key = process.env.INDEXNOW_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Key not configured" }, { status: 500 });
  }

  // The IndexNow crawler expects the key to be returned as plain text
  return new NextResponse(key, {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: "Invalid urls array" }, { status: 400 });
    }

    const success = await notifyIndexNow(urls);
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to notify IndexNow" }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
