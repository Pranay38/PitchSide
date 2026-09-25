import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/server-data";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if params exists
    if (!params || !params.id) {
      return NextResponse.json({ success: false, error: 'Missing ID' }, { status: 400 });
    }
    
    const { id } = params;
    let seoNotes = "";

    try {
      const body = await request.json();
      seoNotes = body.seoNotes || "";
    } catch (e) {
      // Body might be empty
    }

    const { db } = await connectToDatabase();
    const collection = db.collection("posts");

    const result = await collection.updateOne(
      { $or: [{ id }, { _id: id as any }] },
      { 
        $set: { 
          lastSEORefresh: new Date().toISOString(),
          seoNotes: seoNotes,
          updatedAt: new Date().toISOString()
        } 
      }
    );

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Failed to refresh post:", error);
    return NextResponse.json(
      { success: false, error: "Failed to refresh post" },
      { status: 500 }
    );
  }
}
