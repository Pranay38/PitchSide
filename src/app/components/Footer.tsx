import { useState } from "react";
import { Link } from "react-router";
import { Twitter, Instagram, Mail, Heart } from "lucide-react";
import { toast } from "sonner";

export function Footer() {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    // Store subscriber in localStorage for now
    try {
      const subscribers = JSON.parse(localStorage.getItem("pitchside_subscribers") || "[]");
      if (subscribers.includes(email.trim())) {
        toast.info("You're already subscribed! 🎉");
      } else {
        subscribers.push(email.trim());
        localStorage.setItem("pitchside_subscribers", JSON.stringify(subscribers));
        toast.success("Subscribed! You'll hear from us soon ⚽");
      }
    } catch {
      toast.success("Subscribed! You'll hear from us soon ⚽");
    }
    setEmail("");
  };

  return (
    <footer className="mt-20 bg-[#0F172A] dark:bg-[#020617] text-white border-t border-gray-800 transition-colors duration-300">
      <div className="max-w-[1100px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand Column */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <video src="/logo.mp4" autoPlay loop muted playsInline className="w-8 h-8 object-contain rounded" />
              <span className="text-xl font-bold bg-gradient-to-r from-[#16A34A] to-[#4ade80] bg-clip-text text-transparent">
                The Touchline Dribble
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">
              From the touchline to your timeline — sharp football analysis, tactical breakdowns, and bold opinions for the beautiful game.
            </p>
            <div className="flex items-center gap-3">
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-[#1DA1F2]/20 hover:text-[#1DA1F2] transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/5 hover:bg-[#E4405F]/20 hover:text-[#E4405F] transition-all">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="mailto:hello@pitchside.com"
                className="p-2 rounded-lg bg-white/5 hover:bg-[#16A34A]/20 hover:text-[#16A34A] transition-all">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">Explore</h3>
            <ul className="space-y-2.5">
              <li><Link to="/" className="text-sm text-gray-400 hover:text-[#16A34A] transition-colors">Home</Link></li>
              <li><Link to="/about" className="text-sm text-gray-400 hover:text-[#16A34A] transition-colors">About</Link></li>
              <li><a href="mailto:hello@pitchside.com" className="text-sm text-gray-400 hover:text-[#16A34A] transition-colors">Contact</a></li>
            </ul>

            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-3 mt-6">Categories</h3>
            <div className="flex flex-wrap gap-1.5">
              {["Tactics", "Premier League", "La Liga", "Champions League", "Transfer News"].map((cat) => (
                <span key={cat} className="text-xs px-2.5 py-1 rounded-full bg-white/5 text-gray-400 hover:bg-[#16A34A]/20 hover:text-[#16A34A] transition-all cursor-pointer">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-300 mb-4">Stay Updated</h3>
            <p className="text-sm text-gray-400 mb-4">
              Get the latest insights delivered straight to your inbox. No spam, just footy.
            </p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2.5 rounded-lg bg-white/5 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#16A34A] text-white text-sm font-semibold rounded-lg hover:bg-[#15803d] transition-all hover:shadow-lg hover:shadow-[#16A34A]/25 flex-shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; 2026 The Touchline Dribble. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500" /> for the beautiful game
          </p>
        </div>
      </div>
    </footer>
  );
}
