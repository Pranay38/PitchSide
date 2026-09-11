import { NextResponse } from 'next/server';
import { getAllPosts } from '@/app/lib/postStorage';

export async function handleSocialCarousel(req: Request) {
  try {
    const { postId } = await req.json();
    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    const posts = getAllPosts();
    const post = posts.find(p => p.id === postId);

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Title slide
    const slide1 = {
      slideNumber: 1,
      title: post.title,
      body: post.excerpt || "Read our latest football analysis"
    };

    // Extract H2s and their following text to form slides 2-4
    const regexH2 = /<h2[^>]*>(.*?)<\/h2>(.*?)(?=<h2|$)/gi;
    const slidesMiddle = [];
    let match;
    let slideNum = 2;
    
    while ((match = regexH2.exec(post.content)) !== null && slideNum <= 4) {
      const h2Text = match[1].replace(/<[^>]+>/g, '').trim();
      const bodyText = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150) + "...";
      slidesMiddle.push({
        slideNumber: slideNum,
        title: h2Text,
        body: bodyText
      });
      slideNum++;
    }

    // Fallback if no H2s found
    if (slidesMiddle.length === 0) {
      const textOnly = post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const parts = [
        textOnly.slice(0, 150),
        textOnly.slice(150, 300),
        textOnly.slice(300, 450)
      ];
      parts.forEach((p, i) => {
        if (p.length > 10) {
          slidesMiddle.push({
            slideNumber: slideNum++,
            title: `Key Insight ${i + 1}`,
            body: p.trim() + "..."
          });
        }
      });
    }

    const slideLast = {
      slideNumber: slideNum,
      title: "Read the full analysis",
      body: "Link in bio"
    };

    const slides = [slide1, ...slidesMiddle, slideLast].slice(0, 5);

    return NextResponse.json({ slides });
  } catch (error) {
    console.error('Error generating social carousel:', error);
    return NextResponse.json({ error: 'Failed to generate carousel' }, { status: 500 });
  }
}
