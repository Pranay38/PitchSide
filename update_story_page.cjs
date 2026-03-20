const fs = require('fs');

let content = fs.readFileSync('src/app/pages/StoryPage.tsx', 'utf8');

// 1. Add BookOpen context
content = content.replace(/import \{.*?\} from "lucide-react";/s, (match) => {
  return match.replace('Sparkles', 'Sparkles, BookOpen');
});

// 2. Add `getPublishedStories` import
content = content.replace(/getStoryPreview,\n\} from "\.\.\/lib\/storyStorage";/s, (match) => {
    return `getStoryPreview,\n  getPublishedStories,\n} from "../lib/storyStorage";\nimport { PostCard } from "../components/PostCard";`;
});

// 3. Add to the page state:
content = content.replace(/const \[activeChapterId, setActiveChapterId\] = useState\(story\?\.chapters\[0\]\?\.id \|\| ""\);\n\s*const chapterRefs = useRef<Record<string, HTMLElement \| null>>\(\{\}\);/s, (match) => {
    return match + `\n  
  // Calculate reading time based on total words (approx 200 words per minute)
  const readingTime = story 
    ? Math.max(1, Math.ceil(story.chapters.reduce((total, ch) => total + ch.body.join(" ").split(" ").length, 0) / 200))
    : 0;
    
  // Fetch related stories (exclude current)
  const relatedStories = story 
    ? getPublishedStories().filter(s => s.id !== story.id).slice(0, 3) 
    : [];`;
});

// 4. Update the meta tags section under the title
content = content.replace(/<span className="px-4 py-2 rounded-full bg-white\/10 border border-white\/10 text-sm font-semibold">\s*\{story\.readTime\}\s*<\/span>\s*<span className="px-4 py-2 rounded-full bg-white\/10 border border-white\/10 text-sm font-semibold">\s*\{story\.date\}\s*<\/span>\s*<span className="px-4 py-2 rounded-full bg-white\/10 border border-white\/10 text-sm font-semibold">\s*\{story\.chapters\.length\} chapters\s*<\/span>/s, (match) => {
    return `
                <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-semibold">
                  <BookOpen className="w-4 h-4 text-[#16A34A]" /> {readingTime} min read
                </span>
                <span className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-semibold">
                  {story.date}
                </span>
                <span className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm font-semibold">
                  {story.chapters.length} chapters
                </span>`;
});


// 5. Inject the Related Stories section before </main>
content = content.replace(/<\/section>\s*<\/main>/s, (match) => {
    return `</section>
        
        {/* Related Stories Section */}
        {relatedStories.length > 0 && (
          <section className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0B1120] py-16">
            <div className="max-w-[1180px] mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-6 rounded-full gradient-accent" />
                <h2 className="text-2xl font-black font-outfit uppercase tracking-tight text-[#0F172A] dark:text-white">
                  Keep Reading
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedStories.map(related => (
                  <PostCard key={related.id} post={{
                    id: related.id,
                    slug: related.slug,
                    title: related.title,
                    excerpt: related.excerpt,
                    coverImage: related.coverImage,
                    category: "Story",
                    author: { name: "The Touchline Dribble", avatar: "" },
                    date: related.date,
                    readTime: \`\${Math.max(1, Math.ceil(related.chapters.reduce((t, c) => t + c.body.join(" ").split(" ").length, 0) / 200))} min read\`,
                    blocks: []
                  }} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>`;
});


fs.writeFileSync('src/app/pages/StoryPage.tsx', content);
console.log("Updated StoryPage.tsx");
