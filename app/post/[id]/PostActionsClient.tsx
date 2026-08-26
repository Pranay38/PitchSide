"use client";

import { useState, useEffect, useRef } from "react";
import { Heart, Bookmark, Shield, UserRound, Share2, X, Copy, Check, Code } from "lucide-react";
import { toast } from "sonner";
import { useUserPreferences } from "@/app/hooks/useUserPreferences";
import { useUser } from "@clerk/nextjs";

/** WhatsApp icon SVG */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/** Twitter/X icon SVG */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function SharePopover({ title, onClose }: { title: string; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const shareLinks = [
    {
      name: "WhatsApp",
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      icon: WhatsAppIcon,
      color: "hover:bg-[#25D366]/10 hover:text-[#25D366] hover:border-[#25D366]/30",
      bgActive: "bg-[#25D366]",
    },
    {
      name: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=TouchlineDribbl`,
      icon: XIcon,
      color: "hover:bg-white/10 hover:text-white hover:border-white/20",
      bgActive: "bg-[#0F172A]",
    },
  ];

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-2 z-50 w-[260px] rounded-2xl border border-gray-200 bg-white p-3 shadow-2xl shadow-black/10 dark:border-gray-800 dark:bg-[#0F172A] animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Share</p>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <X className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {shareLinks.map((link) => (
          <a
            key={link.name}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-sm font-bold text-[#475569] dark:text-gray-300 transition-all duration-200 ${link.color}`}
          >
            <link.icon className="w-4 h-4" />
            {link.name}
          </a>
        ))}

        <button
          onClick={handleCopy}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-sm font-bold transition-all duration-200 ${
            copied
              ? "bg-[#16A34A]/10 text-[#16A34A] border-[#16A34A]/30"
              : "text-[#475569] dark:text-gray-300 hover:bg-[#16A34A]/10 hover:text-[#16A34A] hover:border-[#16A34A]/30"
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy link"}
        </button>

        <button
          onClick={() => {
            const slug = url.split("/post/")[1] || "";
            const embedCode = `<iframe src="https://www.thetouchlinedribble.in/api/embed/card/${slug}" width="480" height="220" style="border:none;border-radius:16px;" loading="lazy"></iframe>`;
            navigator.clipboard.writeText(embedCode);
            toast.success("Embed code copied!");
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent text-sm font-bold text-[#475569] dark:text-gray-300 transition-all duration-200 hover:bg-purple-500/10 hover:text-purple-500 hover:border-purple-500/30"
        >
          <Code className="w-4 h-4" />
          Embed article
        </button>
      </div>
    </div>
  );
}

export function PostActionsClient({ post }: { 
  post: { id: string; title: string; club?: string; playerName?: string; likedBy: string[] }
}) {
  const { isPostSaved, isClubFollowed, isPlayerFollowed, toggleSavedPost, toggleFollowedClub, toggleFollowedPlayer } = useUserPreferences();
  const { user } = useUser();
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [showShare, setShowShare] = useState(false);

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

  const saved = isPostSaved(post.id);
  const followingClub = post.club ? isClubFollowed(post.club) : false;
  const followingPlayer = post.playerName ? isPlayerFollowed(post.playerName) : false;

  const btnBase = "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-bold transition-all duration-200";
  const btnDefault = "border-gray-200 text-[#475569] hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-800 dark:text-gray-300";
  const btnActive = "border-[#16A34A]/30 bg-[#16A34A]/10 text-[#16A34A]";

  return (
    <div className="mb-6 flex flex-wrap gap-3 relative">
      <button type="button" onClick={handleLike}
        className={`${btnBase} ${isLiked ? btnActive : btnDefault}`}>
        <Heart className={`h-4 w-4 ${isLiked ? "fill-[#16A34A]" : ""}`} />
        {isLiked ? "Liked" : "Like article"}
      </button>

      <button type="button"
        onClick={() => {
          const nextSaved = toggleSavedPost(post.id);
          toast.success(nextSaved ? "Saved to your library" : "Removed from saved.");
        }}
        className={`${btnBase} ${saved ? btnActive : btnDefault}`}>
        <Bookmark className={`h-4 w-4 ${saved ? "fill-[#16A34A]" : ""}`} />
        {saved ? "Saved" : "Save article"}
      </button>

      {post.club && (
        <button type="button"
          onClick={() => {
            const nextFollowing = toggleFollowedClub(post.club!);
            toast.success(nextFollowing ? `Following ${post.club}` : `Unfollowed ${post.club}`);
          }}
          className={`${btnBase} ${
            followingClub
              ? "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-500"
              : "border-gray-200 text-[#475569] hover:border-amber-500/30 hover:text-amber-600 dark:hover:text-amber-500 dark:border-gray-800 dark:text-gray-300"
          }`}>
          <Shield className={`h-4 w-4 ${followingClub ? "fill-amber-500" : ""}`} />
          {followingClub ? `Following ${post.club}` : `Follow ${post.club}`}
        </button>
      )}

      {post.playerName && (
        <button type="button"
          onClick={() => {
            const nextFollowing = toggleFollowedPlayer(post.playerName!);
            toast.success(nextFollowing ? `Following ${post.playerName}` : `Unfollowed ${post.playerName}`);
          }}
          className={`${btnBase} ${followingPlayer ? btnActive : btnDefault}`}>
          <UserRound className="h-4 w-4" />
          {followingPlayer ? `Following ${post.playerName}` : `Follow ${post.playerName}`}
        </button>
      )}

      {/* Share button with popover */}
      <div className="relative">
        <button type="button"
          onClick={() => setShowShare(!showShare)}
          className={`${btnBase} ${showShare ? btnActive : btnDefault}`}>
          <Share2 className="h-4 w-4" />
          Share
        </button>
        {showShare && (
          <SharePopover title={post.title} onClose={() => setShowShare(false)} />
        )}
      </div>
    </div>
  );
}
