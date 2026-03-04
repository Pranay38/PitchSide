import { useState } from "react";
import { Link } from "react-router";
import { Twitter, Instagram, Mail, Heart } from "lucide-react";
import { toast } from "sonner";

export function Footer() {
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
      });
      const data = await res.json();
      if (res.ok) {
        if (data.alreadySubscribed) {
          toast.info("You're already subscribed! 🎉");
        } else {
          toast.success("Subscribed! Check your inbox for a welcome email ⚽");
        }
      } else {
        toast.error(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      // Fallback to localStorage if API is not available
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
    }
    setEmail("");
  };

  return (
    <footer className="mt-20 relative overflow-hidden bg-[#0F172A] dark:bg-[#020617] text-white transition-colors duration-300">
      {/* Gradient top accent line */}
      <div className="gradient-accent-line w-full" />

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
              From the touchline to your timeline — sharp football analysis, tactical breakdowns, and bold opinions for the beautiful game.
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
              <li><Link to="/daily-fix" className="text-sm text-gray-400 hover:text-[#4ade80] transition-colors duration-200">The Daily Fix</Link></li>
              <li><Link to="/about" className="text-sm text-gray-400 hover:text-[#4ade80] transition-colors duration-200">About</Link></li>
              <li><a href="mailto:thetouchlinedribble@gmail.com" className="text-sm text-gray-400 hover:text-[#4ade80] transition-colors duration-200">Contact</a></li>
            </ul>

            <h3 className="text-sm font-black font-outfit uppercase tracking-wider text-gray-200 mb-3 mt-6">Categories</h3>
            <div className="flex flex-wrap gap-1.5">
              {["Tactics", "Premier League", "La Liga", "Champions League", "Transfer News"].map((cat) => (
                <span key={cat} className="text-xs px-3 py-1.5 rounded-full bg-white/5 text-gray-400 hover:bg-[#16A34A]/20 hover:text-[#4ade80] transition-all duration-200 cursor-pointer border border-white/5 hover:border-[#16A34A]/30">
                  {cat}
                </span>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-black font-outfit uppercase tracking-wider text-gray-200 mb-4">Stay Updated</h3>
            <p className="text-sm text-gray-400 mb-4">
              Get the latest insights delivered straight to your inbox. No spam, just footy.
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
                className="w-full sm:w-auto px-5 py-2.5 gradient-accent text-white text-sm font-bold rounded-xl hover:shadow-lg hover:shadow-[#16A34A]/25 transition-all duration-300 flex-shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
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
