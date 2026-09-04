"use client";

import { useState } from "react";
import { Link } from "@/lib/router-compat";
import { Instagram, Mail, Heart } from "lucide-react";
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
    <footer className="mt-20 relative overflow-hidden bg-background border-t border-border text-foreground transition-colors duration-300">
      {/* Gradient top accent line */}


      <div className="max-w-[1100px] mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <img src="/logo.png" alt="The Touchline Dribble" className="w-9 h-9 object-contain rounded-lg" />
              <span className="text-2xl font-headline text-foreground">
                The Touchline Dribble
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">
              The tactical detail your pundit missed. Sharp analysis, bold opinions, and the football debates that actually matter.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://x.com/TouchlineDribbl" target="_blank" rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-secondary hover:bg-foreground hover:text-background transition-all duration-300" aria-label="Follow on X">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
              </a>
              <a href="https://www.instagram.com/thetouchlinedribble/" target="_blank" rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-secondary hover:bg-[#E4405F]/20 hover:text-[#E4405F] transition-all duration-300">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="mailto:thetouchlinedribble@gmail.com"
                className="p-2.5 rounded-xl bg-secondary hover:bg-primary/20 hover:text-primary transition-all duration-300">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-4">Explore</h3>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">Home</Link></li>
              <li><Link to="/archive" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">Archive</Link></li>
              <li><Link to="/stories" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">Stories</Link></li>
              <li><Link to="/collections" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">Reading Lists</Link></li>
              <li><Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">About</Link></li>
              <li><a href="mailto:thetouchlinedribble@gmail.com" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200">Contact</a></li>
            </ul>

            <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-3 mt-6">Categories</h3>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <Link
                  to={topicPath(cat)}
                  key={cat}
                  className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-200 border border-border"
                >
                  {cat}
                </Link>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          {!loading && !newsletterOptIn && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-foreground mb-4">The Touchline Briefing</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Every Friday: the week&apos;s biggest tactical talking point + a weekend match preview. The email your group chat will thank you for.
              </p>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 w-full px-4 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl shadow-sm hover:bg-primary/90 active:scale-95 transition-all duration-300 flex-shrink-0"
                >
                  Subscribe
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            &copy; 2026 The Touchline Dribble. All rights reserved.
          </p>
          <a
            href="https://razorpay.me/@thetouchlinedribble"
            target="_blank"
            rel="noopener noreferrer"
            className="group text-xs text-muted-foreground hover:text-primary transition-colors duration-200 flex items-center gap-1.5"
          >
            <Heart className="w-3 h-3 text-red-500/60 group-hover:text-red-500 group-hover:fill-red-500 transition-colors" />
            Keep it independent
          </a>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for the beautiful game
          </p>
        </div>
      </div>
    </footer>
  );
}

