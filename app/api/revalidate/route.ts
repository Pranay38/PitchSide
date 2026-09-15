import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  // Default to revalidating the homepage if no path is provided
  const path = request.nextUrl.searchParams.get("path") || "/";

  // Check for the secret token to prevent unauthorized cache purging
  // You should add REVALIDATION_SECRET to your Vercel Environment Variables
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: "Invalid secret token" }, { status: 401 });
  }

  try {
    revalidatePath(path);
    return NextResponse.json({ 
      revalidated: true, 
      now: Date.now(), 
      message: `Successfully revalidated path: ${path}` 
    });
  } catch (err) {
    return NextResponse.json(
      { message: "Error revalidating", error: String(err) }, 
      { status: 500 }
    );
  }
}
