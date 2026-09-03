"use client";

import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { Twitter, Instagram, Mail, Heart } from "lucide-react";
import { toast } from "sonner";
import { topicPath } from "../lib/contentPaths";
import { useUserPreferences } from "../hooks/useUserPreferences";

export function Footer() {
  const { newsletterOptIn, setNewsletterOptIn, loading, fanClub, followedClubs } = useUserPreferences();
  const [email, setEmail] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
        credentials: "same-origin",
      });
      const data = await res.json();
      if (res.ok) {
        setNewsletterOptIn(true);
        if (data.alreadySubscribed) {
          toast.info("You're already subscribed! 🎉");
        } else {
          toast.success("Subscribed! Check your inbox for a welcome email ⚽");
        }
      } else {
        toast.error(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      toast.error("Could not save your subscription. Please try again.");
    }
    setEmail("");
  };

  // Construct personalized categories for the footer
  let categories = ["Tactical Breakdowns", "Bold Takes", "Manager Watch", "Premier League", "Champions League", "World Cup"];
  
  if (fanClub?.name || (followedClubs && followedClubs.length > 0)) {
    const customCategories: string[] = [];
    if (fanClub?.name) {
      customCategories.push(fanClub.name);
    }
    if (followedClubs) {
      followedClubs.forEach((club) => {
        if (!customCategories.includes(club)) {
          customCategories.push(club);
        }
      });
    }
    
    // Fill the rest with default categories, up to 6 total
    const defaultCategories = ["Tactical Breakdowns", "Bold Takes", "Manager Watch", "Premier League", "Champions League"];
    for (const cat of defaultCategories) {
      if (!customCategories.includes(cat) && customCategories.length < 6) {
         customCategories.push(cat);
      }
    }
    
    categories = customCategories;
  }

  return (
    <footer className="mt-20 relative overflow-hidden bg-[#0F172A] dark:bg-[#020617] text-white transition-colors duration-300">
      {/* Gradient top accent line */}


      <div className="max-w-[1100px] mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <img src="/logo.png" alt="The Touchline Dribble" className="w-9 h-9 object-contain rounded-lg" />
              <span className="text-xl font-extrabold font-outfit bg-gradient-to-r from-[#16A34A] via-[#22c55e] to-[#4ade80] bg-clip-text text-transparent">
                The Touchline Dribble
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              The tactical detail your pundit missed. Sharp analysis, bold opinions, and the football debates that actually matter.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://x.com/TouchlineDribbl" target="_blank" rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] hover:shadow-lg hover:shadow-[#1DA1F2]/10 transition-all duration-300">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://www.instagram.com/thetouchlinedribble/" target="_blank" rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-[#E4405F]/20 hover:text-[#E4405F] hover:shadow-lg hover:shadow-[#E4405F]/10 transition-all duration-300">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="mailto:thetouchlinedribble@gmail.com"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-[#16A34A]/20 hover:text-[#16A34A] hover:shadow-lg hover:shadow-[#16A34A]/10 transition-all duration-300">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-black font-outfit uppercase tracking-wider text-gray-200 mb-4">Explore</h3>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-sm text-gray-400 hover:text-[#4ade80] transition-colors duration-200">Home</Link></li>
              <li><Link to="/archive" className="text-sm text-gray-400 hover:text-[#4ade80] transition-colors duration-200">Archive</Link></li>
              <li><Link to="/stories" className="text-sm text-gray-400 hover:text-[#4ade80] transition-colors duration-200">Stories</Link></li>
              <li><Link to="/collections" className="text-sm text-gray-400 hover:text-[#4ade80] transition-colors duration-200">Reading Lists</Link></li>
              <li><Link to="/about" className="text-sm text-gray-400 hover:text-[#4ade80] transition-colors duration-200">About</Link></li>
              <li><a href="mailto:thetouchlinedribble@gmail.com" className="text-sm text-gray-400 hover:text-[#4ade80] transition-colors duration-200">Contact</a></li>
            </ul>

            <h3 className="text-sm font-black font-outfit uppercase tracking-wider text-gray-200 mb-3 mt-6">Categories</h3>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <Link
                  to={topicPath(cat)}
                  key={cat}
                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-[#16A34A]/20 hover:text-[#4ade80] transition-all duration-200 cursor-pointer border border-white/5 hover:border-[#16A34A]/30"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          {!loading && !newsletterOptIn && (
            <div>
              <h3 className="text-sm font-black font-outfit uppercase tracking-wider text-gray-200 mb-4">The Touchline Briefing</h3>
              <p className="text-sm text-gray-400 mb-4">
                Every Friday: the week&apos;s biggest tactical talking point + a weekend match preview. The email your group chat will thank you for.
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all duration-300 backdrop-blur-sm"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r flex items-center justify-center gap-2 from-[#16A34A] to-[#22c55e] border border-transparent hover:border-white/10 text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-[#16A34A]/30 active:scale-95 transition-all duration-300 flex-shrink-0"
                >
                  Subscribe
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; 2026 The Touchline Dribble. All rights reserved.
          </p>
          <a
            href="https://razorpay.me/@thetouchlinedribble"
            target="_blank"
            rel="noopener noreferrer"
            className="group text-xs text-gray-500 hover:text-[#4ade80] transition-colors duration-200 flex items-center gap-1.5"
          >
            <Heart className="w-3 h-3 text-red-500/60 group-hover:text-red-400 group-hover:fill-red-400 transition-colors" />
            Keep it independent
          </a>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for the beautiful game
          </p>
        </div>
      </div>
    </footer>
  );
}

