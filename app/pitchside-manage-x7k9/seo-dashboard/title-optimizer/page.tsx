'use client';
import { useState, useEffect } from 'react';
import { validateTitle, suggestTitleImprovements } from '@/lib/seo-title-utils';

export default function TitleOptimizer() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // We are simulating fetching posts, as we don't have a direct /api/posts route readily available that returns what we want in this environment.
    // In a real scenario, you'd fetch from /api/posts here.
    const fetchPosts = async () => {
      try {
        // Fallback to empty array if no API, or you could implement the server action
        setPosts([]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  const filteredPosts = posts.filter(post => {
    if (filter === 'all') return true;
    const validation = validateTitle(post.title);
    if (filter === 'needs_attention') return validation.issues.length > 0;
    if (filter === 'missing_year') return !validation.hasYear;
    if (filter === 'too_long') return validation.charCount > 60;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Title Optimizer</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#0F172A] border border-gray-800 rounded-md text-gray-300 hover:bg-gray-800 text-sm">
            Add year to all missing
          </button>
          <button className="px-4 py-2 bg-[#0F172A] border border-gray-800 rounded-md text-gray-300 hover:bg-gray-800 text-sm">
            Generate Meta Descriptions
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {['all', 'needs_attention', 'missing_year', 'too_long'].map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
              filter === f ? 'bg-green-600 text-white' : 'bg-[#0F172A] text-gray-400 border border-gray-800'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-gray-400">Loading posts...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="p-8 border border-gray-800 rounded-lg bg-[#0F172A] text-center text-gray-400">
            No posts found or API endpoint not configured.
          </div>
        ) : (
          filteredPosts.map(post => {
            const validation = validateTitle(post.title);
            const suggestions = suggestTitleImprovements(post.title);
            
            return (
              <div key={post.id} className="p-4 bg-[#0F172A] border border-gray-800 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-white">{post.title}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${validation.valid ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                    {validation.charCount} chars
                  </span>
                </div>
                
                <div className="text-sm text-gray-400 mb-4">
                  {post.metaDescription || "No meta description"} 
                  <span className="ml-2 text-xs text-gray-500">({post.metaDescription?.length || 0} chars)</span>
                </div>

                {!validation.valid && (
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-yellow-500 mb-1">Suggestions:</h4>
                    <ul className="list-disc pl-4 text-xs text-gray-400">
                      {suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                
                <button className="text-sm text-green-500 hover:text-green-400 font-medium">Edit Title & Meta</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
