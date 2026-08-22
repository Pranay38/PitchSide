import { NextResponse } from "next/server";

const CACHE_TTL = 60 * 60 * 24 * 7; // 1 week

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");

  if (!name) {
    return new NextResponse("Missing name", { status: 400 });
  }

  try {
    const res = await fetch(
      `https://www.thesportsdb.com/api/v1/json/3/searchplayers.php?p=${encodeURIComponent(name)}`,
      { next: { revalidate: CACHE_TTL } }
    );
    const data = await res.json();

    if (data && data.player && data.player.length > 0) {
      // Prefer cutout (transparent bg) over thumb (headshot)
      const player = data.player[0];
      const imageUrl = player.strCutout || player.strThumb || player.strRender;
      
      if (imageUrl) {
        return NextResponse.redirect(imageUrl, 302);
      }
    }
  } catch (error) {
    console.error("Player image fetch error:", error);
  }

  // Fallback transparent 1x1 pixel if not found (or we could let the client handle onError)
  return new NextResponse(
    Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64"),
    {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
      },
    }
  );
}
