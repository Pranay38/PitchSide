import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  ArrowUpRight,
  BookOpen,
  Command,
  Newspaper,
  Repeat2,
  Search,
  Sparkles,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "./ui/command";
import { buildArchiveEntries } from "../lib/contentIndex";
import { topicPath } from "../lib/contentPaths";
import { getPublishedPosts, getPublishedPostsAsync } from "../lib/postStorage";
import { getAllStories, getAllStoriesAsync } from "../lib/storyStorage";
import { getSiteSettings, getSiteSettingsAsync } from "../lib/siteSettingsStorage";
import { buildTransferReliabilityBoard } from "../lib/transferReliability";

function buildTopicItems(entries: ReturnType<typeof buildArchiveEntries>) {
  const counts = new Map<string, number>();
  entries.forEach((entry) => {
    entry.topics.forEach((topic) => {
      counts.set(topic, (counts.get(topic) || 0) + 1);
    });
  });

  return Array.from(counts.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 8)
    .map(([topic, count]) => ({
      id: topic,
      title: topic,
      subtitle: `${count} archive result${count === 1 ? "" : "s"}`,
      href: topicPath(topic),
      keywords: `${topic} topic page`,
    }));
}

export function DesktopCommandPalette() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState(() => buildArchiveEntries(getPublishedPosts(), getAllStories()));
  const [transferEntries, setTransferEntries] = useState(() => buildTransferReliabilityBoard(getSiteSettings().transferWatch));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (window.innerWidth < 1024) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!open) return;

    let mounted = true;
    Promise.all([getPublishedPostsAsync(), getAllStoriesAsync(), getSiteSettingsAsync()])
      .then(([posts, stories, settings]) => {
        if (!mounted) return;
        setEntries(buildArchiveEntries(posts, stories));
        setTransferEntries(buildTransferReliabilityBoard(settings.transferWatch));
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  const topicItems = useMemo(() => buildTopicItems(entries), [entries]);

  const navigationItems = [
    { title: "Home", subtitle: "Front page", href: "/" },
    { title: "Archive", subtitle: "Search every article and story", href: "/archive" },
    { title: "Stories", subtitle: "Premium longform", href: "/stories" },
    { title: "Transfers", subtitle: "Reliability board and dossiers", href: "/transfers" },
    { title: "Collections", subtitle: "Editorial reading lists", href: "/collections" },
  ];

  const openPath = (href: string) => {
    setOpen(false);
    navigate(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden lg:inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white/80 px-3.5 py-1.5 text-sm font-semibold text-[#475569] transition-colors hover:border-[#16A34A]/30 hover:text-[#16A34A] dark:border-gray-700 dark:bg-[#0F172A]/80 dark:text-gray-300"
      >
        <Search className="h-4 w-4 text-[#94A3B8]" />
        Search the site
        <span className="inline-flex items-center gap-1 rounded-full bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#94A3B8] dark:bg-[#08111f]">
          <Command className="h-3 w-3" />
          K
        </span>
      </button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search the site"
        description="Jump to articles, stories, dossiers, and topic pages."
      >
        <CommandInput placeholder="Search articles, stories, transfers, or topic pages..." />
        <CommandList>
          <CommandEmpty>No matching result found.</CommandEmpty>

          <CommandGroup heading="Navigate">
            {navigationItems.map((item) => (
              <CommandItem key={item.href} value={`${item.title} ${item.subtitle}`} onSelect={() => openPath(item.href)}>
                <ArrowUpRight className="h-4 w-4 text-[#16A34A]" />
                <div className="flex flex-col">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-[#64748B]">{item.subtitle}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Articles + Stories">
            {entries.map((entry) => (
              <CommandItem
                key={`${entry.type}-${entry.id}`}
                value={`${entry.title} ${entry.excerpt} ${entry.club} ${entry.league} ${entry.topics.join(" ")}`}
                onSelect={() => openPath(entry.href)}
              >
                {entry.type === "story" ? (
                  <BookOpen className="h-4 w-4 text-[#16A34A]" />
                ) : (
                  <Newspaper className="h-4 w-4 text-[#16A34A]" />
                )}
                <div className="flex flex-col">
                  <span className="font-medium">{entry.title}</span>
                  <span className="text-xs text-[#64748B]">{entry.type === "story" ? entry.format : `${entry.club || entry.format} · ${entry.readTime}`}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          {transferEntries.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Transfer Dossiers">
                {transferEntries.slice(0, 6).map((entry) => (
                  <CommandItem
                    key={entry.id}
                    value={`${entry.player} ${entry.club} ${entry.boardLabel} ${entry.rationale.join(" ")}`}
                    onSelect={() => openPath(`/transfers/${entry.dossierSlug}`)}
                  >
                    <Repeat2 className="h-4 w-4 text-[#16A34A]" />
                    <div className="flex flex-col">
                      <span className="font-medium">{entry.player} to {entry.club}</span>
                      <span className="text-xs text-[#64748B]">{entry.boardLabel} · {entry.reliabilityScore}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          <CommandSeparator />

          <CommandGroup heading="Topic Pages">
            {topicItems.map((item) => (
              <CommandItem key={item.id} value={`${item.title} ${item.keywords}`} onSelect={() => openPath(item.href)}>
                <Sparkles className="h-4 w-4 text-[#16A34A]" />
                <div className="flex flex-col">
                  <span className="font-medium">{item.title}</span>
                  <span className="text-xs text-[#64748B]">{item.subtitle}</span>
                </div>
                <CommandShortcut>Topic</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
