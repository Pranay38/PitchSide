"use client";

import { useState } from "react";
import { BlogPost } from "@/app/data/posts";

export default function RefreshQueueClient({ posts }: { posts: BlogPost[] }) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [localPosts, setLocalPosts] = useState(posts);

  const calculateStaleness = (post: BlogPost) => {
    const lastDateStr = post.lastSEORefresh || post.updatedAt || post.date;
    const lastDate = lastDateStr ? new Date(lastDateStr) : new Date();
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleRefresh = async (id: string) => {
    try {
      setLoadingId(id);
      const seoNotes = notes[id] || "";
      const res = await fetch(`/api/posts/${id}/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seoNotes }),
      });

      if (res.ok) {
        setLocalPosts((prev) =>
          prev.map((p) =>
            p.id === id || p.slug === id
              ? {
                  ...p,
                  lastSEORefresh: new Date().toISOString(),
                  seoNotes: seoNotes,
                }
              : p
          )
        );
        setNotes((prev) => ({ ...prev, [id]: "" }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const sortedPosts = [...localPosts].sort(
    (a, b) => calculateStaleness(b) - calculateStaleness(a)
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-outfit p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#39FF14]">
          SEO Content Refresh Queue
        </h1>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950 border-b border-zinc-800 text-zinc-400">
                  <th className="p-4 font-semibold">Post Title</th>
                  <th className="p-4 font-semibold">Published Date</th>
                  <th className="p-4 font-semibold">Last Refresh</th>
                  <th className="p-4 font-semibold">Staleness</th>
                  <th className="p-4 font-semibold">SEO Notes</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {sortedPosts.map((post) => {
                  const stalenessDays = calculateStaleness(post);
                  const isStale = stalenessDays > 42;

                  return (
                    <tr key={post.id} className="hover:bg-zinc-800/50 transition-colors">
                      <td className="p-4 max-w-xs truncate">
                        {post.title}
                      </td>
                      <td className="p-4 text-sm text-zinc-400">
                        {post.date ? new Date(post.date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="p-4 text-sm text-zinc-400">
                        {post.lastSEORefresh
                          ? new Date(post.lastSEORefresh).toLocaleDateString()
                          : "Never"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full font-medium ${
                            isStale
                              ? "bg-red-500/20 text-red-400 border border-red-500/30"
                              : "bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30"
                          }`}
                        >
                          {stalenessDays} days
                        </span>
                      </td>
                      <td className="p-4">
                        <input
                          type="text"
                          placeholder="e.g. Added 2026 stats"
                          className="bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm w-full focus:outline-none focus:border-[#39FF14] text-white"
                          value={notes[post.id] || ""}
                          onChange={(e) =>
                            setNotes({ ...notes, [post.id]: e.target.value })
                          }
                        />
                        {post.seoNotes && (
                          <div className="mt-1 text-xs text-zinc-500 truncate" title={post.seoNotes}>
                            Last: {post.seoNotes}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => handleRefresh(post.id)}
                          disabled={loadingId === post.id}
                          className="bg-[#39FF14]/10 hover:bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30 px-3 py-1.5 rounded text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {loadingId === post.id ? "Saving..." : "Mark Refreshed"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sortedPosts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500">
                      No posts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
