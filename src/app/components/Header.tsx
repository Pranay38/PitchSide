import { useState } from "react";
import { Link } from "react-router";
import { useTheme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { getClubByName } from "../data/clubs";
import { Heart, House, Menu, X } from "lucide-react";

interface HeaderProps {
  onChangeClub?: () => void;
  favoriteClub?: string | null;
}

export function Header({ onChangeClub, favoriteClub }: HeaderProps) {
  useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const club = favoriteClub ? getClubByName(favoriteClub) : null;

  return (
    <>
      {/* Animated gradient accent line at the very top */}
      <div className="gradient-accent-line w-full" />
      <header className="sticky top-0 z-50 glass transition-colors duration-300">
        <div className="max-w-[1100px] mx-auto px-6 py-3.5 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5">
            <div className="relative">
              <img src="/logo.png" alt="The Touchline Dribble" className="w-9 h-9 object-contain rounded-lg group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 rounded-lg bg-[#16A34A]/0 group-hover:bg-[#16A34A]/10 transition-colors duration-300" />
            </div>
            <span className="text-xl font-extrabold font-outfit bg-gradient-to-r from-[#16A34A] via-[#22c55e] to-[#4ade80] bg-clip-text text-transparent group-hover:from-[#4ade80] group-hover:to-[#16A34A] transition-all duration-500">
              The Touchline Dribble
            </span>
          </Link>

          {/* Desktop Right side */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Nav links with underline sweep */}
            {[
              { to: "/", label: "Home" },
              { to: "/tactics", label: "Tactics" },
              { to: "/daily-fix", label: "Daily Fix" },
              { to: "/collections", label: "Lists" },
              { to: "/debates", label: "Debates" },
              { to: "/about", label: "About" },
            ].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                aria-label={link.label}
                className="relative text-sm font-semibold text-[#475569] dark:text-gray-300 hover:text-[#16A34A] dark:hover:text-[#4ade80] transition-colors duration-200 py-1 group"
              >
                {link.to === "/" ? <House className="w-4 h-4" /> : link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#16A34A] to-[#4ade80] group-hover:w-full transition-all duration-300 rounded-full" />
              </Link>
            ))}

            {/* Club badge */}
            {favoriteClub && (
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card glow-green">
                {club?.logo ? (
                  <img src={club.logo} alt={favoriteClub} className="w-5 h-5 object-contain" />
                ) : (
                  <Heart className="w-4 h-4 text-[#16A34A]" />
                )}
                <span className="text-sm font-semibold text-[#16A34A]">
                  {favoriteClub}
                </span>
              </div>
            )}

            {/* Change club */}
            {onChangeClub && (
              <button
                onClick={onChangeClub}
                className="text-sm text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors font-medium"
              >
                Change
              </button>
            )}

            <ThemeToggle />
          </div>

          {/* Mobile: club badge + hamburger */}
          <div className="flex sm:hidden items-center gap-2">
            {favoriteClub && club?.logo && (
              <img src={club.logo} alt={favoriteClub} className="w-5 h-5 object-contain" />
            )}
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-800/50 text-[#64748B] dark:text-gray-400 transition-all duration-200"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileOpen && (
          <div className="sm:hidden glass border-t border-white/10 dark:border-gray-800/50 px-6 py-4 space-y-3 animate-float-in">
            <Link to="/" onClick={() => setMobileOpen(false)} aria-label="Home" className="block text-sm font-semibold text-[#0F172A] dark:text-white hover:text-[#16A34A] transition-colors py-2"><House className="w-4 h-4" /></Link>
            <Link to="/tactics" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#0F172A] dark:text-white hover:text-[#16A34A] transition-colors py-2">Tactics</Link>
            <Link to="/daily-fix" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#0F172A] dark:text-white hover:text-[#16A34A] transition-colors py-2">Daily Fix</Link>
            <Link to="/collections" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#0F172A] dark:text-white hover:text-[#16A34A] transition-colors py-2">Lists</Link>
            <Link to="/debates" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#0F172A] dark:text-white hover:text-[#16A34A] transition-colors py-2">Debates</Link>
            <Link to="/about" onClick={() => setMobileOpen(false)} className="block text-sm font-semibold text-[#0F172A] dark:text-white hover:text-[#16A34A] transition-colors py-2">About</Link>

            {favoriteClub && (
              <div className="flex items-center gap-2 py-2">
                {club?.logo && <img src={club.logo} alt={favoriteClub} className="w-5 h-5 object-contain" />}
                <span className="text-sm font-semibold text-[#16A34A]">{favoriteClub}</span>
              </div>
            )}

            {onChangeClub && (
              <button
                onClick={() => { onChangeClub(); setMobileOpen(false); }}
                className="block w-full text-left text-sm text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors font-medium py-2"
              >
                {favoriteClub ? "Change Club" : "Select Club"}
              </button>
            )}
          </div>
        )}
      </header>
    </>
  );
}
