import { NextResponse } from 'next/server';
import { getAllPosts } from '@/app/lib/postStorage';

export async function handleSocialThread(req: Request) {
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

    // Generate Twitter thread
    // Basic logic for MVP without heavy AI setup (unless provided)
    // Extracting text and making some tweets
    const contentText = post.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Split into sentences roughly
    const sentences = contentText.match(/[^\.!\?]+[\.!\?]+/g) || [contentText];
    
    const hook = `🚨 NEW: ${post.title}\n\n${post.excerpt || sentences[0]?.trim()}\n\n🧵 Thread below ⬇️⚽`;
    
    const keyPoints = [];
    let currentTweet = "";
    
    for (let i = 1; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;
      
      if (currentTweet.length + sentence.length > 250) {
        if (currentTweet) keyPoints.push(`📊 ${currentTweet}`);
        currentTweet = sentence;
        if (keyPoints.length >= 4) break;
      } else {
        currentTweet += (currentTweet ? " " : "") + sentence;
      }
    }
    
    if (currentTweet && keyPoints.length < 4) {
      keyPoints.push(`🎯 ${currentTweet}`);
    }

    const cta = `Read the full analysis and more exclusive insights on The Touchline Dribble 🏟️👇\n\nhttps://touchlinedribble.com/post/${post.slug || post.id}`;

    const thread = [
      hook,
      ...keyPoints,
      cta
    ].slice(0, 7); // Ensure max 7 tweets

    return NextResponse.json({ thread });
  } catch (error) {
    console.error('Error generating social thread:', error);
    return NextResponse.json({ error: 'Failed to generate thread' }, { status: 500 });
  }
}
