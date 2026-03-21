import { useState, useEffect, useCallback } from "react";
import {
  Bell,
  MessageSquare,
  Mail,
  Trophy,
  Target,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

type NotificationType = "comment" | "subscriber" | "poll_milestone" | "prediction";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  meta: Record<string, any>;
  createdAt: string;
}

const TYPE_CONFIG: Record<NotificationType, { label: string; icon: React.FC<any>; bg: string; text: string; border: string }> = {
  comment: {
    label: "Comment",
    icon: MessageSquare,
    bg: "bg-sky-500/10",
    text: "text-sky-600 dark:text-sky-400",
    border: "border-sky-500/20",
  },
  subscriber: {
    label: "Subscriber",
    icon: Mail,
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20",
  },
  poll_milestone: {
    label: "Poll",
    icon: Trophy,
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20",
  },
  prediction: {
    label: "Predictor",
    icon: Target,
    bg: "bg-violet-500/10",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-500/20",
  },
};

const TIME_RANGES = [
  { label: "Last 24h", hours: 24 },
  { label: "Last 7 days", hours: 168 },
  { label: "Last 30 days", hours: 720 },
];

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotificationCard({ notification }: { notification: Notification }) {
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.icon;

  return (
    <div className={`flex items-start gap-4 rounded-2xl border ${config.border} ${config.bg} px-4 py-3`}>
      {/* Icon */}
      <div className={`mt-0.5 shrink-0 rounded-xl p-1.5 ${config.bg}`}>
        <Icon className={`h-4 w-4 ${config.text}`} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <span className={`text-[10px] font-bold uppercase tracking-widest ${config.text}`}>
            {config.label}
          </span>
          <span className="text-[11px] text-gray-400">{timeAgo(notification.createdAt)}</span>
        </div>
        <p className="text-sm text-[#0F172A] dark:text-white leading-snug">
          {notification.message}
        </p>

        {/* Post link for comments */}
        {notification.type === "comment" && notification.meta.postId && (
          <a
            href={`/post/${notification.meta.postId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#16A34A] hover:underline"
          >
            {notification.meta.postTitle || notification.meta.postId}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-100 dark:border-gray-800 px-4 py-3 animate-pulse">
      <div className="mt-0.5 w-7 h-7 rounded-xl bg-gray-200 dark:bg-gray-700 shrink-0" />
      <div className="flex-1 space-y-1.5">
        <div className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="h-3.5 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      </div>
    </div>
  );
}

export function AdminNotificationsTab() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [timeRangeHours, setTimeRangeHours] = useState(168); // 7 days
  const [typeFilter, setTypeFilter] = useState<"all" | NotificationType>("all");
  const [pollingEnabled, setPollingEnabled] = useState(true);

  const pwd = (import.meta as any).env?.VITE_ADMIN_PASSWORD || (typeof localStorage !== "undefined" ? localStorage.getItem("pitchside_pwd") : "");

  const fetchNotifications = useCallback(async () => {
    try {
      const since = new Date(Date.now() - timeRangeHours * 60 * 60 * 1000).toISOString();
      const res = await fetch(`/api/sys?route=notifications&since=${encodeURIComponent(since)}`, {
        headers: { Authorization: `Bearer ${pwd}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setLastRefreshed(new Date());
    } catch {
      // Silently ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, [timeRangeHours, pwd]);

  // Initial load + polling every 30s
  useEffect(() => {
    setLoading(true);
    void fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!pollingEnabled) return;
    const interval = setInterval(() => void fetchNotifications(), 30_000);
    return () => clearInterval(interval);
  }, [pollingEnabled, fetchNotifications]);

  const filtered = typeFilter === "all"
    ? notifications
    : notifications.filter(n => n.type === typeFilter);

  // Counts per type
  const counts = notifications.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black font-outfit text-[#0F172A] dark:text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#16A34A]" />
            Notification Centre
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Live feed · Auto-refreshes every 30s · Last: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setLoading(true); void fetchNotifications(); }}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:border-[#16A34A] hover:text-[#16A34A] transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setPollingEnabled(p => !p)}
            className={`rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
              pollingEnabled
                ? "bg-[#16A34A]/10 text-[#16A34A]"
                : "bg-gray-100 dark:bg-gray-800 text-gray-500"
            }`}
          >
            {pollingEnabled ? "Live ●" : "Paused"}
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(Object.entries(TYPE_CONFIG) as [NotificationType, typeof TYPE_CONFIG[NotificationType]][]).map(([type, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={type} className={`rounded-2xl border ${cfg.border} ${cfg.bg} p-4`}>
              <Icon className={`h-4 w-4 ${cfg.text} mb-2`} />
              <p className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white">{counts[type] || 0}</p>
              <p className="text-[11px] font-medium text-gray-500 mt-0.5">{cfg.label}s</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Time range */}
        <div className="flex rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          {TIME_RANGES.map(r => (
            <button
              key={r.hours}
              onClick={() => { setTimeRangeHours(r.hours); setLoading(true); }}
              className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                timeRangeHours === r.hours
                  ? "bg-[#0F172A] text-white dark:bg-white dark:text-[#0F172A]"
                  : "text-gray-500 hover:text-[#0F172A] dark:hover:text-white"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-1.5">
          {(["all", "comment", "subscriber", "poll_milestone", "prediction"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors capitalize ${
                typeFilter === t
                  ? "bg-[#16A34A] text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-[#16A34A]"
              }`}
            >
              {t === "poll_milestone" ? "Poll Milestones" : t}
              {t !== "all" && counts[t] ? ` (${counts[t]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <NotificationSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 py-12 text-center">
            <Bell className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-400">No notifications in the selected range</p>
          </div>
        ) : (
          filtered.map(n => <NotificationCard key={n.id} notification={n} />)
        )}
      </div>
    </div>
  );
}
