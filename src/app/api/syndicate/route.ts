import { NextResponse } from "next/server";
import { generateSyndicationContent } from "../../../../server/endpoints/syndicate";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { postId, platforms } = body;

    if (!postId || !Array.isArray(platforms)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const result = await generateSyndicationContent(postId, platforms);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error generating syndication:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
