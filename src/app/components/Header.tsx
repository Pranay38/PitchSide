import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useTheme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { DesktopCommandPalette } from "./DesktopCommandPalette";
import { SearchModal } from "./SearchModal";
import { getClubByName } from "../data/clubs";
import { Heart, House, Menu, Search, X, LogIn } from "lucide-react";
import { PillNav } from "./PillNav";
import {
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";

/** Returns true if Clerk is loaded and available */
function useClerkAvailable(): boolean {
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useUser();
    return true;
  } catch {
    return false;
  }
}

function AuthButton() {
  const clerkAvailable = useClerkAvailable();
  if (!clerkAvailable) return null;
  return <AuthButtonInner />;
}

function AuthButtonInner() {
  const { isSignedIn, isLoaded } = useUser();
  if (!isLoaded) return null;

  if (isSignedIn) {
    return <UserButton afterSignOutUrl="/" />;
  }

  return (
    <SignInButton mode="modal">
      <button className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#16A34A]/10 hover:bg-[#16A34A]/20 text-[#16A34A] text-sm font-bold transition-colors duration-200">
        <LogIn className="w-3.5 h-3.5" />
        Sign In
      </button>
    </SignInButton>
  );
}

interface HeaderProps {
  onChangeClub?: () => void;
  favoriteClub?: string | null;
}

export function Header({ onChangeClub, favoriteClub }: HeaderProps) {
  useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [archiveQuery, setArchiveQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const club = favoriteClub ? getClubByName(favoriteClub) : null;
  const navLinks = [
    { to: "/", label: "Home", icon: <House className="w-4 h-4" /> },
    { to: "/archive", label: "Archive" },
    { to: "/stories", label: "Stories" },
    { to: "/transfers", label: "Transfers" },
    { to: "/transfer-tracker", label: "Tracker" },
    { to: "/collections", label: "Lists" },
    { to: "/about", label: "About" },
  ];

  const pillNavItems = navLinks.map(link => ({
    href: link.to,
    label: link.label,
    icon: link.icon
  }));

  useEffect(() => {
    if (location.pathname !== "/archive") return;
    setArchiveQuery(new URLSearchParams(location.search).get("q") || "");
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleScroll = () => {
      // Shrink and blur when scrolled down 100px
      if (window.scrollY > 100) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleArchiveSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (archiveQuery.trim()) {
      params.set("q", archiveQuery.trim());
    }
    navigate(params.toString() ? `/archive?${params.toString()}` : "/archive");
    setMobileOpen(false);
  };

  return (
    <>
      {/* Animated gradient accent line at the very top */}
      <div className="gradient-accent-line w-full" />
      <header className={`sticky top-0 z-50 transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        isScrolled 
          ? "glass shadow-sm dark:shadow-none bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5" 
          : "bg-transparent border-b border-transparent"
      }`}>
        <div className={`w-full max-w-7xl mx-auto px-4 lg:px-6 flex items-center justify-between transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] ${
          isScrolled ? "py-2" : "py-3.5"
        }`}>
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5 flex-shrink-0">
            <div className="relative">
              <img src="/logo.png" alt="The Touchline Dribble" className="w-9 h-9 object-contain rounded-lg group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 rounded-lg bg-[#16A34A]/0 group-hover:bg-[#16A34A]/10 transition-colors duration-300" />
            </div>
            <span className="hidden xl:block text-xl font-extrabold font-outfit bg-gradient-to-r from-[#16A34A] via-[#22c55e] to-[#4ade80] bg-clip-text text-transparent group-hover:from-[#4ade80] group-hover:to-[#16A34A] transition-all duration-500 whitespace-nowrap">
              The Touchline Dribble
            </span>
          </Link>

          {/* Desktop Nav - Centered with PillNav */}
          <div className="hidden lg:flex flex-1 justify-center px-4 2xl:px-8"
            style={{
              "--pill-base": "rgba(22, 163, 74, 0.1)", // #16A34A with 10% opacity for hover circle
              "--pill-bg": "transparent",
              "--pill-hover-text": "#16A34A",
              "--pill-text": "currentColor",
              "--pill-pad-x": "12px", // Decrease inner padding to save space
            } as React.CSSProperties}
          >
            <PillNav 
              items={pillNavItems}
              initialLoadAnimation={true}
              className="text-[#475569] dark:text-gray-300 w-full justify-center flex"
            />
          </div>

          {/* Desktop Right side */}
          <div className="hidden sm:flex items-center justify-end gap-2 lg:gap-3 flex-shrink-0 relative z-10 min-w-max">
            <DesktopCommandPalette />

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

            <div className="flex items-center gap-2 lg:gap-3">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-gray-500 hover:text-[#16A34A] dark:text-gray-400 dark:hover:text-[#4ade80] transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-[#1E293B]"
                aria-label="Search"
              >
                <Search className="w-5 h-5" />
              </button>
              <ThemeToggle />
              <NotificationBell />
              <AuthButton />
            </div>
          </div>

          {/* Mobile: club badge + hamburger */}
          <div className="flex sm:hidden items-center gap-2 relative z-10">
            {favoriteClub && club?.logo && (
              <img src={club.logo} alt={favoriteClub} className="w-5 h-5 object-contain" />
            )}
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E293B] rounded-full transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

          {/* Mobile menu dropdown */}
          {mobileOpen && (
            <div className="sm:hidden glass border-t border-white/10 dark:border-gray-800/50 px-6 py-4 space-y-3 animate-float-in">
              <form onSubmit={handleArchiveSearch} className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-[#0F172A]">
                <Search className="w-4 h-4 text-[#94A3B8]" />
                <input
                  type="search"
                  value={archiveQuery}
                  onChange={(event) => setArchiveQuery(event.target.value)}
                  placeholder="Search archive"
                  className="flex-1 bg-transparent text-sm text-[#0F172A] outline-none placeholder:text-[#94A3B8] dark:text-white"
                />
              </form>
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  aria-label={link.label}
                  className="block text-sm font-semibold text-[#0F172A] dark:text-white hover:text-[#16A34A] transition-colors py-2"
                >
                  {link.icon || link.label}
                </Link>
              ))}

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

              <AuthButton />
            </div>
          )}
        </header>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
