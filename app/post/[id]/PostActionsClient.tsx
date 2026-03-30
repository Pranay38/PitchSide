"use client";

import { useState, useEffect } from "react";
import { Copy, Heart, Bookmark, Shield, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useUserPreferences } from "@/app/hooks/useUserPreferences";
import { useUser } from "@clerk/clerk-react";

export function PostActionsClient({ post }: { 
  post: { id: string; title: string; club?: string; playerName?: string; likedBy: string[] }
}) {
  const { isPostSaved, isClubFollowed, isPlayerFollowed, toggleSavedPost, toggleFollowedClub, toggleFollowedPlayer } = useUserPreferences();
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setIsLiked(post.likedBy?.includes(user.id) || false);
    }
  }, [post.likedBy, user?.id]);

  const handleLike = async () => {
    if (!user) return toast.error("Please sign in to like articles.");
    
    setIsLiked(!isLiked);
    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, userId: user.id })
      });
    } catch {
      setIsLiked(isLiked); // Revert
      toast.error("Failed to update like status.");
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard.");
  };

  const saved = isPostSaved(post.id);
  const followingClub = post.club ? isClubFollowed(post.club) : false;
  const followingPlayer = post.playerName ? isPlayerFollowed(post.playerName) : false;

  return (
    <div className="mb-6 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleLike}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${
          isLiked
            ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
            : "border-gray-200 text-[#475569] hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-800 dark:text-gray-300"
        }`}
      >
        <Heart className={`h-4 w-4 ${isLiked ? "fill-[#16A34A]" : ""}`} />
        {isLiked ? "Liked" : "Like article"}
      </button>

      <button
        type="button"
        onClick={() => {
          const nextSaved = toggleSavedPost(post.id);
          toast.success(nextSaved ? "Saved to your library" : "Removed from saved.");
        }}
        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${
          saved
            ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
            : "border-gray-200 text-[#475569] hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-800 dark:text-gray-300"
        }`}
      >
        <Bookmark className={`h-4 w-4 ${saved ? "fill-[#16A34A]" : ""}`} />
        {saved ? "Saved" : "Save article"}
      </button>

      {post.club && (
        <button
          type="button"
          onClick={() => {
            const nextFollowing = toggleFollowedClub(post.club!);
            toast.success(nextFollowing ? `Following ${post.club}` : `Unfollowed ${post.club}`);
          }}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${
            followingClub
              ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-500"
              : "border-gray-200 text-[#475569] hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-500 dark:border-gray-800 dark:text-gray-300"
          }`}
        >
          <Shield className={`h-4 w-4 ${followingClub ? "fill-amber-500" : ""}`} />
          {followingClub ? `Following ${post.club}` : `Follow ${post.club}`}
        </button>
      )}

      {post.playerName && (
        <button
          type="button"
          onClick={() => {
            const nextFollowing = toggleFollowedPlayer(post.playerName!);
            toast.success(nextFollowing ? `Following ${post.playerName}` : `Unfollowed ${post.playerName}`);
          }}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${
            followingPlayer
              ? "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]"
              : "border-gray-200 text-[#475569] hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-800 dark:text-gray-300"
          }`}
        >
          <UserRound className="h-4 w-4" />
          {followingPlayer ? `Following ${post.playerName}` : `Follow ${post.playerName}`}
        </button>
      )}

      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2.5 text-sm font-bold text-[#475569] transition-colors hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-800 dark:text-gray-300"
      >
        <Copy className="h-4 w-4" />
        Copy link
      </button>
    </div>
  );
}
