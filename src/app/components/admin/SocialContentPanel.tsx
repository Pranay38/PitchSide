import React, { useState } from "react";
import { Copy, Check, Loader2, RefreshCw } from "lucide-react";
import type { BlogPost } from "@/app/data/posts";
import { ShareableQuoteGenerator } from "../ShareableQuoteGenerator";

interface SocialContentPanelProps {
  post: BlogPost;
}

export function SocialContentPanel({ post }: SocialContentPanelProps) {
  const [activeTab, setActiveTab] = useState<"quote" | "thread" | "carousel">("quote");
  
  // Thread State
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadTweets, setThreadTweets] = useState<string[]>([]);
  const [threadCopied, setThreadCopied] = useState(false);
  const [threadError, setThreadError] = useState("");

  // Carousel State
  const [carouselLoading, setCarouselLoading] = useState(false);
  const [carouselSlides, setCarouselSlides] = useState<any[]>([]);
  const [carouselError, setCarouselError] = useState("");

  const handleGenerateThread = async () => {
    setThreadLoading(true);
    setThreadError("");
    try {
      const res = await fetch("/api/social-thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setThreadTweets(data.thread || []);
    } catch (err: any) {
      setThreadError(err.message);
    } finally {
      setThreadLoading(false);
    }
  };

  const handleGenerateCarousel = async () => {
    setCarouselLoading(true);
    setCarouselError("");
    try {
      const res = await fetch("/api/social-carousel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCarouselSlides(data.slides || []);
    } catch (err: any) {
      setCarouselError(err.message);
    } finally {
      setCarouselLoading(false);
    }
  };

  const handleCopyThread = () => {
    const text = threadTweets.join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
    setThreadCopied(true);
    setTimeout(() => setThreadCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-6">
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <button
          onClick={() => setActiveTab("quote")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === "quote" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
        >
          Quote Card
        </button>
        <button
          onClick={() => setActiveTab("thread")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === "thread" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
        >
          Twitter Thread
        </button>
        <button
          onClick={() => setActiveTab("carousel")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === "carousel" ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"}`}
        >
          Carousel
        </button>
      </div>

      {activeTab === "quote" && (
        <div>
          <ShareableQuoteGenerator content={post.content} author={post.author?.name || "The Touchline Dribble"} />
        </div>
      )}

      {activeTab === "thread" && (
        <div className="space-y-4">
          <button
            onClick={handleGenerateThread}
            disabled={threadLoading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {threadLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {threadTweets.length > 0 ? "Regenerate Thread" : "Generate Thread"}
          </button>
          
          {threadError && <p className="text-red-500 text-sm">{threadError}</p>}
          
          {threadTweets.length > 0 && (
            <div className="space-y-4 mt-6">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-gray-900 dark:text-white">Thread Preview</h4>
                <button
                  onClick={handleCopyThread}
                  className="flex items-center gap-2 text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {threadCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {threadCopied ? "Copied!" : "Copy All"}
                </button>
              </div>
              <div className="space-y-3">
                {threadTweets.map((tweet, i) => (
                  <div key={i} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-sm">
                    {tweet}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "carousel" && (
        <div className="space-y-4">
          <button
            onClick={handleGenerateCarousel}
            disabled={carouselLoading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {carouselLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {carouselSlides.length > 0 ? "Regenerate Carousel" : "Generate Carousel"}
          </button>
          
          {carouselError && <p className="text-red-500 text-sm">{carouselError}</p>}
          
          {carouselSlides.length > 0 && (
            <div className="grid gap-4 mt-6 md:grid-cols-2 lg:grid-cols-3">
              {carouselSlides.map((slide, i) => (
                <div key={i} className="p-6 bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-800 aspect-[4/5] flex flex-col justify-center text-center">
                  <h4 className="font-bold text-xl text-white mb-4">{slide.title}</h4>
                  <p className="text-gray-300 text-sm">{slide.body}</p>
                  <div className="mt-8 text-xs text-gray-500 font-bold uppercase tracking-widest">
                    Slide {slide.slideNumber}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
