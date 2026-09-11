import { connectToDatabase } from "../../_api/_db";

export async function generateSyndicationContent(postId: string, platforms: ('reddit' | 'substack' | 'medium')[]) {
  const { db } = await connectToDatabase();
  const post = await db.collection("posts").findOne({ id: postId });
  
  if (!post) {
    throw new Error("Post not found");
  }

  const siteUrl = "https://www.thetouchlinedribble.in";
  const postUrl = `${siteUrl}/post/${post.slug || post.id}`;
  
  const result: { reddit?: string; substack?: string; medium?: string } = {};
  
  const title = post.title || "Untitled";
  const fullHtml = post.content || "";
  
  // Basic content processing
  const strippedText = fullHtml.replace(/<[^>]*>?/gm, ''); // Naive HTML strip
  const hook = strippedText.split('. ').slice(0, 3).join('. ') + '.';
  
  // HTML stripping site specific stuff (react components) could just be regex for Substack/Medium
  // We'll use 40% of the HTML for Substack/Medium
  const paragraphs = fullHtml.split(/<\/p>\s*<p>/i);
  const cutoffIndex = Math.ceil(paragraphs.length * 0.4);
  const truncatedHtml = paragraphs.slice(0, cutoffIndex).join('</p><p>') + (paragraphs.length > 1 ? '</p>' : '');

  if (platforms.includes('reddit')) {
    result.reddit = `${title}

${hook}

Key Takeaways:
- Point 1 from the analysis
- Point 2 from the analysis
- Point 3 from the analysis

---

[Read the full tactical breakdown on The Touchline Dribble →](${postUrl})

Suggested Subreddits: r/soccer, r/PremierLeague, r/${post.club?.replace(/\s/g, '') || 'football'}`;
  }

  const substackMediumCta = `
<hr/>
<p><em>This article continues on The Touchline Dribble. <a href="${postUrl}">Read the complete analysis →</a></em></p>
<p><em>Originally published at <a href="${siteUrl}">thetouchlinedribble.in</a></em></p>`;

  if (platforms.includes('substack')) {
    result.substack = `${truncatedHtml}${substackMediumCta}`;
  }

  if (platforms.includes('medium')) {
    result.medium = `${truncatedHtml}${substackMediumCta}`;
  }

  return result;
}
