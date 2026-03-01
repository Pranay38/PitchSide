import { useState } from "react";
import { Link } from "react-router";
import { useTheme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { getClubByName } from "../data/clubs";
import { Heart, Menu, X } from "lucide-react";

interface HeaderProps {
  onChangeClub?: () => void;
  favoriteClub?: string | null;
}

export function Header({ onChangeClub, favoriteClub }: HeaderProps) {
  useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const club = favoriteClub ? getClubByName(favoriteClub) : null;

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300">
      <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="The Touchline Dribble" className="w-8 h-8 object-contain rounded" />
          <span className="text-xl font-bold bg-gradient-to-r from-[#16A34A] to-[#22c55e] bg-clip-text text-transparent">
            The Touchline Dribble
          </span>
        </Link>

        {/* Desktop Right side */}
        <div className="hidden sm:flex items-center gap-3">
          {/* Nav links */}
          <Link to="/" className="text-sm font-medium text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors">Home</Link>
          <Link to="/about" className="text-sm font-medium text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors">About</Link>

          {/* Club badge */}
          {favoriteClub && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#16A34A]/10 dark:bg-[#16A34A]/20">
              {club?.logo ? (
                <img src={club.logo} alt={favoriteClub} className="w-5 h-5 object-contain" />
              ) : (
                <Heart className="w-4 h-4 text-[#16A34A]" />
              )}
              <span className="text-sm font-medium text-[#16A34A]">
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
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-[#64748B] dark:text-gray-400 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileOpen && (
        <div className="sm:hidden bg-white dark:bg-[#0F172A] border-t border-gray-200/50 dark:border-gray-800/50 px-6 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-[#0F172A] dark:text-white hover:text-[#16A34A] transition-colors py-2">Home</Link>
          <Link to="/about" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-[#0F172A] dark:text-white hover:text-[#16A34A] transition-colors py-2">About</Link>

          {favoriteClub && (
            <div className="flex items-center gap-2 py-2">
              {club?.logo && <img src={club.logo} alt={favoriteClub} className="w-5 h-5 object-contain" />}
              <span className="text-sm font-medium text-[#16A34A]">{favoriteClub}</span>
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
  );
}
