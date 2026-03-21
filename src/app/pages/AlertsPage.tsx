import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { Bell, Mail, Plus, Repeat2, ShieldAlert, UserRound, X } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useClubPreference } from "../hooks/useClubPreference";
import { getPublishedPosts } from "../lib/postStorage";
import { useUserPreferences } from "../hooks/useUserPreferences";
import { buildSiteAlerts, type SiteAlert } from "../lib/alertCenter";
import { getTransferWatchEntriesAsync } from "../lib/siteSettingsStorage";
import { toast } from "sonner";

export function AlertsPage() {
  const { favoriteClub } = useClubPreference();
  const posts = useMemo(() => getPublishedPosts(), []);
  
  const {
    followedClubs,
    followedPlayers,
    followedTransfers,
    toggleFollowedClub,
    toggleFollowedPlayer,
    toggleFollowedTransfer,
    markAlertsSeen
  } = useUserPreferences();

  const [alerts, setAlerts] = useState<SiteAlert[]>([]);
  const [email, setEmail] = useState("");
  const [clubDraft, setClubDraft] = useState("");
  const [playerDraft, setPlayerDraft] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAlerts = async () => {
      try {
        const transferWatch = await getTransferWatchEntriesAsync();
        const nextAlerts = await buildSiteAlerts({
          followedClubs,
          followedPlayers,
          followedTransfers,
          posts,
          transferWatch,
        });
        if (!isMounted) return;
        setAlerts(nextAlerts);
        markAlertsSeen(nextAlerts.map((alert) => alert.id));
      } catch {
        if (isMounted) setAlerts([]);
      }
    };

    if (followedClubs.length === 0 && followedPlayers.length === 0 && followedTransfers.length === 0) {
      setAlerts([]);
      return () => {
        isMounted = false;
      };
    }

    void loadAlerts();
    return () => {
      isMounted = false;
    };
  }, [followedClubs, followedPlayers, followedTransfers, posts]);

  const addClub = () => {
    if (!clubDraft.trim()) return;
    toggleFollowedClub(clubDraft.trim());
    setClubDraft("");
  };

  const addPlayer = () => {
    if (!playerDraft.trim()) return;
    toggleFollowedPlayer(playerDraft.trim());
    setPlayerDraft("");
  };

  const saveEmailAlerts = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }

    try {
      const res = await fetch("/api/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          alertPreferences: {
            clubs: followedClubs,
            players: followedPlayers,
            transfers: followedTransfers,
            emailAlerts: true,
          },
        }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "Failed to save preferences");
      toast.success(payload.alreadySubscribed ? "Alert preferences updated." : "Email alerts saved.");
      setEmail("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save email alerts.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] transition-colors duration-300">
      <SEO
        title="Alerts"
        description="Follow clubs, players, and transfer topics to see a site alert feed and save email alert preferences."
        url="https://pitchside-orcin.vercel.app/alerts"
      />
      <Header favoriteClub={favoriteClub} />

      <main className="max-w-[1180px] mx-auto px-4 sm:px-6 py-8">
        <section className="mb-10">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#16A34A] mb-3">Alert Center</p>
          <h1 className="text-3xl md:text-5xl font-black font-outfit text-[#0F172A] dark:text-white">
            Club Alerting
          </h1>
          <p className="text-base text-[#64748B] dark:text-gray-400 max-w-3xl mt-3">
            Follow clubs, players, and transfer topics. The page turns that into a lightweight alert feed so your site has a reason to bring fans back even when they miss a publishing day.
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              to="/transfers"
              className="px-4 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-bold hover:bg-[#15803d]"
            >
              Transfer Reliability Board
            </Link>
            {favoriteClub && !followedClubs.includes(favoriteClub) && (
              <button
                type="button"
                onClick={() => {
                  toggleFollowedClub(favoriteClub);
                  setFollowedClubs(getFollowedClubs());
                  toast.success(`Following ${favoriteClub} alerts`);
                }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-bold text-[#0F172A] dark:text-white hover:border-[#16A34A]/30"
              >
                Follow {favoriteClub}
              </button>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[0.95fr_1.05fr] gap-8 mb-10">
          <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-4 h-4 text-[#16A34A]" />
                <h2 className="text-lg font-black font-outfit text-[#0F172A] dark:text-white">What You Follow</h2>
              </div>
              <p className="text-sm text-[#64748B] dark:text-gray-400">
                Clubs and players can be added here. Transfer topics are followed from the Transfer Reliability board.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white mb-2">Follow a club</p>
                <div className="flex gap-2">
                  <input
                    value={clubDraft}
                    onChange={(e) => setClubDraft(e.target.value)}
                    placeholder="Arsenal"
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                  <button
                    type="button"
                    onClick={addClub}
                    className="px-4 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {followedClubs.length > 0 ? followedClubs.map((club) => (
                    <button
                      key={club}
                      type="button"
                      onClick={() => {
                        toggleFollowedClub(club);
                        setFollowedClubs(getFollowedClubs());
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-semibold text-[#16A34A]"
                    >
                      {club}
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )) : (
                    <p className="text-sm text-[#64748B] dark:text-gray-400">No clubs followed yet.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white mb-2">Follow a player</p>
                <div className="flex gap-2">
                  <input
                    value={playerDraft}
                    onChange={(e) => setPlayerDraft(e.target.value)}
                    placeholder="Jude Bellingham"
                    className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                  />
                  <button
                    type="button"
                    onClick={addPlayer}
                    className="px-4 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-bold"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {followedPlayers.length > 0 ? followedPlayers.map((player) => (
                    <button
                      key={player}
                      type="button"
                      onClick={() => {
                        toggleFollowedPlayer(player);
                        setFollowedPlayers(getFollowedPlayers());
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-semibold text-[#0F172A] dark:text-white"
                    >
                      <UserRound className="w-3.5 h-3.5 text-[#16A34A]" />
                      {player}
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )) : (
                    <p className="text-sm text-[#64748B] dark:text-gray-400">No players followed yet.</p>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-bold text-[#0F172A] dark:text-white mb-2">Transfer topics</p>
                <div className="flex flex-wrap gap-2">
                  {followedTransfers.length > 0 ? followedTransfers.map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => {
                        toggleFollowedTransfer(topic);
                        setFollowedTransfers(getFollowedTransfers());
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-sm font-semibold text-[#64748B] dark:text-gray-300"
                    >
                      <Repeat2 className="w-3.5 h-3.5 text-[#16A34A]" />
                      {topic.replace(":", " -> ")}
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )) : (
                    <p className="text-sm text-[#64748B] dark:text-gray-400">No transfer topics followed yet.</p>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={saveEmailAlerts} className="rounded-2xl border border-[#16A34A]/20 bg-[#16A34A]/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Mail className="w-4 h-4 text-[#16A34A]" />
                <h3 className="text-base font-black font-outfit text-[#0F172A] dark:text-white">Email alert preferences</h3>
              </div>
              <p className="text-sm text-[#64748B] dark:text-gray-400 mb-4">
                Save your followed clubs, players, and transfer topics against an email so future alert sends can target what you actually care about.
              </p>
              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827] px-4 py-2.5 text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#16A34A] text-white text-sm font-bold"
                >
                  Save Email Alerts
                </button>
              </div>
            </form>
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-4 h-4 text-[#16A34A]" />
              <h2 className="text-lg font-black font-outfit text-[#0F172A] dark:text-white">Site Alerts</h2>
            </div>
            <div className="space-y-3">
              {alerts.length > 0 ? alerts.map((alert) => (
                <a
                  key={alert.id}
                  href={alert.href}
                  className="block rounded-xl border border-gray-100 dark:border-gray-800 p-4 hover:border-[#16A34A]/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-[0.18em] ${alert.priority === 1 ? "text-red-500" : alert.priority === 2 ? "text-amber-500" : "text-[#16A34A]"}`}>
                      {alert.kind.replace(/-/g, " ")}
                    </span>
                    <span className="text-[11px] text-[#94A3B8]">{alert.date}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] dark:text-white">{alert.title}</h3>
                  <p className="text-sm text-[#64748B] dark:text-gray-400 mt-2">{alert.summary}</p>
                </a>
              )) : (
                <p className="text-sm text-[#64748B] dark:text-gray-400">
                  Follow at least one club, player, or transfer topic to start generating alerts.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
