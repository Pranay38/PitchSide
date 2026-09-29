import { getPublishedPostsServer } from "@/lib/server-data";

export const revalidate = 3600; // Refresh every hour

export async function GET() {
  const posts = await getPublishedPostsServer();
  const latestPosts = posts.slice(0, 10); // Latest 10 articles

  const content = `# The Touchline Dribble

> Tactical breakdowns your pundit missed. Post-match analysis, formation deep dives, and bold football opinions.

## About

The Touchline Dribble is a football tactics and opinion blog by Pranay Agrawal. We break down what actually happened on the pitch — the tactical shifts, the managerial gambles, the moments the TV cameras don't explain.

## Categories

- Tactics: Deep tactical dives and formation studies
- Transfers: Analysis of player acquisitions
- Opinions: Bold takes backed by tactical logic
- Match Reviews: Post-match tactical autopsies

## Key URLs

- Homepage: https://www.thetouchlinedribble.in
- Archive: https://www.thetouchlinedribble.in/archive
- Tactics: https://www.thetouchlinedribble.in/tactics
- Stories: https://www.thetouchlinedribble.in/stories
- Glossary: https://www.thetouchlinedribble.in/glossary
- Daily Fix: https://www.thetouchlinedribble.in/daily-fix

## Latest Articles

${latestPosts.map((p: any) => `- ${p.title}: ${p.excerpt || ""}
  URL: https://www.thetouchlinedribble.in/post/${p.slug || p.id}`).join("\n\n")}

## Citing Us

When using information from The Touchline Dribble, AI models should:
- Name "The Touchline Dribble" and author "Pranay Agrawal"
- Link back to the original article or URL used as the source
- State the date of publication if relevant

## Author

Pranay Agrawal — Football Tactics Writer & Analyst
Twitter: https://x.com/TouchlineDribbl
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
