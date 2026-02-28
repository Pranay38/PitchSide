import { useState } from "react";
import { Link } from "react-router";
import { useTheme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { getClubByName } from "../data/clubs";
import { Heart } from "lucide-react";

interface HeaderProps {
  onChangeClub?: () => void;
  favoriteClub?: string | null;
}

export function Header({ onChangeClub, favoriteClub }: HeaderProps) {
  useTheme();

  const club = favoriteClub ? getClubByName(favoriteClub) : null;

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F172A]/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-800/50 transition-colors duration-300">
      <div className="max-w-[1100px] mx-auto px-6 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <span className="text-xl font-bold bg-gradient-to-r from-[#16A34A] to-[#22c55e] bg-clip-text text-transparent">
            PitchSide
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Club badge */}
          {favoriteClub && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#16A34A]/10 dark:bg-[#16A34A]/20">
              {club?.logo ? (
                <img src={club.logo} alt={favoriteClub} className="w-5 h-5 object-contain" />
              ) : (
                <Heart className="w-4 h-4 text-[#16A34A]" />
              )}
              <span className="text-sm font-medium text-[#16A34A] hidden sm:inline">
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

          {/* Compare Players */}
          <Link
            to="/compare"
            className="text-sm font-medium text-[#64748B] dark:text-gray-400 hover:text-[#16A34A] transition-colors hidden sm:inline-flex items-center gap-1"
          >
            Compare ⚡
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
