import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

interface PlayerSearchBarProps {
  players: string[];
  selectedPlayer: string | null;
  onSelect: (player: string | null) => void;
  placeholder?: string;
  label?: string;
}

function filterPlayers(players: string[], query: string, selected: string | null): string[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return players.filter((name) => name !== selected).slice(0, 8);
  }

  return players
    .filter((name) => name !== selected)
    .filter((name) => name.toLowerCase().includes(trimmed))
    .slice(0, 12);
}

export function PlayerSearchBar({
  players,
  selectedPlayer,
  onSelect,
  placeholder = "Search player (e.g. Rodri, Saka, Musiala)",
  label,
}: PlayerSearchBarProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const results = useMemo(
    () => filterPlayers(players, query, selectedPlayer),
    [players, query, selectedPlayer],
  );

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, open]);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleSelect = (player: string) => {
    onSelect(player);
    setQuery("");
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    onSelect(null);
    setOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if (event.key === "ArrowDown" && results.length > 0) {
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, results.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0 && results[activeIndex]) {
      event.preventDefault();
      handleSelect(results[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      {label && (
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#64748B] dark:text-[#94A3B8] mb-2">
          {label}
        </p>
      )}

      <div className="relative">
        <Search className="w-4 h-4 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full rounded-xl border border-[#CBD5E1] dark:border-[#334155] bg-white dark:bg-[#0F172A]
            px-11 py-3 text-sm text-[#0F172A] dark:text-white placeholder:text-[#94A3B8]
            focus:outline-none focus:ring-2 focus:ring-[#16A34A]/35 focus:border-[#16A34A] transition"
        />

        {(query || selectedPlayer) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full
              text-[#64748B] hover:text-[#0F172A] dark:hover:text-white hover:bg-[#E2E8F0] dark:hover:bg-[#1E293B] transition"
            aria-label="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {selectedPlayer && (
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#16A34A]/10 border border-[#16A34A]/20 px-3 py-1.5">
          <span className="text-xs text-[#15803D] dark:text-[#4ADE80] font-semibold">{selectedPlayer}</span>
        </div>
      )}

      {open && results.length > 0 && (
        <ul
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-[#CBD5E1] dark:border-[#334155]
            bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md shadow-xl max-h-72 overflow-y-auto"
        >
          {results.map((player, index) => (
            <li
              key={player}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSelect(player)}
              className={`cursor-pointer px-4 py-2.5 text-sm transition flex items-center justify-between gap-4 ${
                index == activeIndex
                  ? "bg-[#16A34A]/10 text-[#166534] dark:text-[#4ADE80]"
                  : "text-[#334155] dark:text-[#CBD5E1] hover:bg-[#F1F5F9] dark:hover:bg-[#111827]"
              }`}
            >
              <span>{player}</span>
              <span className="text-[10px] uppercase tracking-wider text-[#94A3B8]">Pick</span>
            </li>
          ))}
        </ul>
      )}

      {open && query.trim().length >= 2 && results.length === 0 && (
        <div
          className="absolute z-30 mt-2 w-full rounded-xl border border-[#CBD5E1] dark:border-[#334155]
            bg-white dark:bg-[#0B1120] px-4 py-4 text-sm text-[#64748B] dark:text-[#94A3B8]"
        >
          No players found for "{query.trim()}".
        </div>
      )}
    </div>
  );
}
