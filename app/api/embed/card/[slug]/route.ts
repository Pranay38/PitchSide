import { NextRequest, NextResponse } from "next/server";
import { getPostByIdServer } from "@/lib/server-data";

/**
 * Serves a standalone, embeddable HTML card for any article.
 * Usage: <iframe src="https://thetouchlinedribble.in/api/embed/card/SLUG" width="480" height="280"></iframe>
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPostByIdServer(slug);

  if (!post) {
    return new NextResponse("Post not found", { status: 404 });
  }

  const postUrl = `https://thetouchlinedribble.in/post/${post.slug || post.id}`;
  const ogImage = `https://thetouchlinedribble.in/api/og?title=${encodeURIComponent(post.title)}${post.club ? `&club=${encodeURIComponent(post.club)}` : ""}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; background: transparent; }
    a { text-decoration: none; color: inherit; }
    .card {
      display: flex;
      overflow: hidden;
      border-radius: 16px;
      background: #0b1326;
      border: 1px solid rgba(255,255,255,0.06);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4);
      max-width: 480px;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    .card:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px rgba(22,163,74,0.15);
    }
    .card-image {
      width: 160px;
      min-height: 200px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .card-body {
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      flex: 1;
      min-width: 0;
    }
    .card-tag {
      display: inline-block;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #16A34A;
      background: rgba(22,163,74,0.1);
      padding: 3px 10px;
      border-radius: 50px;
      margin-bottom: 10px;
    }
    .card-title {
      font-size: 16px;
      font-weight: 800;
      color: #e2e8f0;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-excerpt {
      font-size: 12px;
      color: #94A3B8;
      line-height: 1.5;
      margin-top: 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .card-brand {
      font-size: 10px;
      font-weight: 700;
      color: #475569;
      letter-spacing: 0.05em;
    }
    .card-cta {
      font-size: 11px;
      font-weight: 700;
      color: #16A34A;
    }
  </style>
</head>
<body>
  <a href="${postUrl}" target="_blank" rel="noopener noreferrer" class="card">
    <img class="card-image" src="${post.coverImage}" alt="${post.title.replace(/"/g, '&quot;')}" />
    <div class="card-body">
      <div>
        ${post.club ? `<span class="card-tag">${post.club}</span>` : ""}
        <h2 class="card-title">${post.title}</h2>
        ${post.excerpt ? `<p class="card-excerpt">${post.excerpt}</p>` : ""}
      </div>
      <div class="card-footer">
        <span class="card-brand">thetouchlinedribble.in</span>
        <span class="card-cta">Read →</span>
      </div>
    </div>
  </a>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate=86400",
      "X-Frame-Options": "ALLOWALL",
    },
  });
}
