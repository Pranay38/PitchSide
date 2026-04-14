import { useState, useEffect, useMemo } from "react";
import { X, Briefcase, ChevronRight, BookmarkMinus } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { getPublishedPosts } from "../lib/postStorage";
import { postPath } from "../lib/contentPaths";

interface BriefcaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BriefcaseDrawer({ isOpen, onClose }: BriefcaseDrawerProps) {
  const { savedPosts: savedPostIds, toggleSavePost } = useUserPreferences();
  const allPosts = useMemo(() => getPublishedPosts(), []);

  const savedPosts = useMemo(() => {
    return allPosts.filter((post) => savedPostIds.includes(post.id));
  }, [allPosts, savedPostIds]);

  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0F172A]/40 dark:bg-black/60 backdrop-blur-sm z-[100] transition-opacity animate-in fade-in"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-[#0B1120] border-l border-gray-200 dark:border-gray-800 shadow-2xl z-[101] flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#16A34A]/10 text-[#16A34A]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white uppercase tracking-tight">The Briefcase</h2>
              <p className="text-xs text-[#64748B] dark:text-gray-400 font-medium">Your saved analysis</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {savedPosts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
              <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-4" />
              <p className="text-sm font-semibold text-[#0F172A] dark:text-white">Your briefcase is empty</p>
              <p className="text-xs text-[#64748B] dark:text-gray-400 mt-2 max-w-[200px]">
                Tap the save icon on any article to store it here for later reading.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {savedPosts.map((post) => (
                <div key={post.id} className="group relative flex flex-col gap-2 p-4 rounded-2xl bg-gray-50 dark:bg-[#0F172A] border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 transition-all">
                  <div className="flex gap-3">
                    {post.coverImage && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-800">
                        <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] uppercase font-black tracking-widest text-[#16A34A] mb-1 truncate">
                        {post.category || "Tactics"}
                      </p>
                      <h3 className="text-sm font-bold text-[#0F172A] dark:text-white leading-snug line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1">
                        {new Date(post.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 mt-2 border-t border-gray-200/50 dark:border-gray-700/50">
                    <button 
                      onClick={() => toggleSavePost(post.id)}
                      className="text-xs flex items-center gap-1.5 font-semibold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <BookmarkMinus className="w-3.5 h-3.5" /> Remove
                    </button>
                    <Link 
                      to={postPath(post)}
                      onClick={onClose}
                      className="text-xs flex items-center gap-1 font-bold text-[#0F172A] dark:text-white hover:text-[#16A34A] dark:hover:text-[#16A34A] transition-colors"
                    >
                      Read Now <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {savedPosts.length > 0 && (
          <div className="p-4 border-t border-gray-100 dark:border-gray-800/50 bg-gray-50/50 dark:bg-[#0B1120]/50 backdrop-blur-sm">
            <Link 
              to="/saved" 
              onClick={onClose}
              className="w-full flex items-center justify-center py-3 px-4 rounded-xl font-bold text-sm bg-[#0F172A] dark:bg-white text-white dark:text-[#0F172A] hover:bg-[#16A34A] dark:hover:bg-[#16A34A] dark:hover:text-white transition-colors"
            >
              View Full Library
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
