import { useState, useEffect, type ReactNode } from "react";
import { Users, FileText, MessageSquare, Flame, BarChart3, Mail, RefreshCw, AlertCircle, CheckCircle, XCircle, Clock, TrendingUp, AlertTriangle, Activity, type LucideIcon } from "lucide-react";

// Cron job staleness threshold: 25 hours (24h cron cycle + 1h buffer)
const STALE_THRESHOLD_MS = 25 * 60 * 60 * 1000;
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    AreaChart,
    Area,
} from "recharts";

interface CronJob {
    jobName: string;
    lastRunAt: string;
    status: string;
    error: string | null;
    emailsSent?: number;
    day1Sent?: number;
    day3Sent?: number;
}

interface ErrorLog {
    type: string;
    email: string;
    error: string;
    timestamp: string;
}

interface GrowthEntry {
    date: string;
    newSubscribers: number;
    cumulativeTotal: number;
}

interface AnalyticsData {
    kpis: {
        totalSubscribers: number;
        totalPosts: number;
        totalComments: number;
        totalDebates: number;
        totalPollVotes: number;
    };
    topPosts: {
        title: string;
        views: number;
        likes: number;
    }[];
    newsletters: {
        subject: string;
        sentAt: string;
        sent: number;
        failed: number;
    }[];
    subscriberGrowth: GrowthEntry[];
    cronHealth: CronJob[];
    recentErrors: ErrorLog[];
}

interface KpiCardProps {
    icon: LucideIcon;
    label: string;
    value: string;
    iconBg: string;
    iconColor: string;
    valueColor?: string;
}

function KpiCard({ icon: Icon, label, value, iconBg, iconColor, valueColor = "text-[#0F172A] dark:text-white" }: KpiCardProps) {
    return (
        <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-3">
                <div className={`p-2 ${iconBg} rounded-lg ${iconColor}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">{label}</span>
            </div>
            <span className={`text-2xl font-bold ${valueColor} mt-auto`}>{value}</span>
        </div>
    );
}

export function AdminAnalyticsTab() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        setError(null);
        try {
            const pwd = localStorage.getItem("pitchside_admin_auth") || "";
            const res = await fetch("/api/sys?route=analytics", {
                headers: { Authorization: `Bearer ${pwd}` }
            });
            if (!res.ok) throw new Error("Failed to load analytics data");
            const result = await res.json();
            setData(result);
        } catch (e: any) {
            console.error(e);
            setError(e.message || "An error occurred");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="w-8 h-8 text-[#16A34A] animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Crunching the numbers...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
                <h3 className="text-red-800 dark:text-red-400 font-semibold mb-1">Failed to load analytics</h3>
                <p className="text-red-600 dark:text-red-300 text-sm mb-4">{error}</p>
                <button
                    onClick={fetchAnalytics}
                    className="px-4 py-2 bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    const { kpis, topPosts, newsletters, subscriberGrowth, cronHealth, recentErrors } = data;

    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    const formatShortDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const timeAgo = (isoString: string) => {
        const diff = Date.now() - new Date(isoString).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        const days = Math.floor(hrs / 24);
        return `${days}d ago`;
    };

    const chartData = topPosts.map(p => ({
        ...p,
        shortTitle: p.title.length > 25 ? p.title.substring(0, 25) + "..." : p.title
    }));

    // Calculate 30-day subscriber gain
    const totalNewSubs = subscriberGrowth.reduce((sum, e) => sum + e.newSubscribers, 0);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-[#16A34A]" /> Platform Metrics
                    </h1>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                        Growth engine visibility — subscribers, cron health, errors.
                    </p>
                </div>
                <button
                    onClick={() => fetchAnalytics(true)}
                    disabled={refreshing}
                    className="p-2 text-gray-400 hover:text-[#16A34A] bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                    title="Refresh Data"
                >
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KpiCard icon={Users} label="Subscribers" value={formatNumber(kpis.totalSubscribers)} iconBg="bg-blue-50 dark:bg-blue-500/10" iconColor="text-blue-500" />
                <KpiCard icon={TrendingUp} label="30d Growth" value={`+${totalNewSubs}`} iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconColor="text-emerald-500" valueColor="text-emerald-600 dark:text-emerald-400" />
                <KpiCard icon={FileText} label="Published" value={formatNumber(kpis.totalPosts)} iconBg="bg-emerald-50 dark:bg-emerald-500/10" iconColor="text-emerald-500" />
                <KpiCard icon={MessageSquare} label="Comments" value={formatNumber(kpis.totalComments)} iconBg="bg-purple-50 dark:bg-purple-500/10" iconColor="text-purple-500" />
                <KpiCard icon={Flame} label="Debates" value={formatNumber(kpis.totalDebates)} iconBg="bg-orange-50 dark:bg-orange-500/10" iconColor="text-orange-500" />
            </div>

            {/* Subscriber Growth Chart */}
            <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#16A34A]" /> Subscriber Growth (30 Days)
                        </h3>
                        <p className="text-xs text-[#64748B] dark:text-gray-400 mt-1">Cumulative total and daily new sign-ups</p>
                    </div>
                </div>
                {subscriberGrowth.length > 0 ? (
                    <div className="w-full h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={subscriberGrowth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatShortDate}
                                    tick={{ fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={false}
                                    stroke="#9CA3AF"
                                    interval={4}
                                />
                                <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} stroke="#9CA3AF" />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} stroke="#9CA3AF" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                                    labelFormatter={formatShortDate}
                                />
                                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="cumulativeTotal"
                                    name="Total Subs"
                                    stroke="#16A34A"
                                    fill="url(#gradientTotal)"
                                    strokeWidth={2}
                                />
                                <Bar
                                    yAxisId="right"
                                    dataKey="newSubscribers"
                                    name="New (daily)"
                                    fill="#3B82F6"
                                    radius={[4, 4, 0, 0]}
                                    barSize={12}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-72 flex items-center justify-center text-sm text-gray-500 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                        Not enough data yet.
                    </div>
                )}
            </div>

            {/* Cron Health + Errors side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cron Health */}
                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-[#16A34A]" />
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Cron Health</h3>
                    </div>
                    {cronHealth.length > 0 ? (
                        <div className="space-y-3">
                            {cronHealth.map((job) => {
                                const isHealthy = job.status === "success";
                                const isStale = job.lastRunAt
                                    ? (Date.now() - new Date(job.lastRunAt).getTime()) > STALE_THRESHOLD_MS
                                    : true;
                                return (
                                    <div
                                        key={job.jobName}
                                        className={`flex items-center justify-between rounded-xl p-4 border ${
                                            !isHealthy
                                                ? "border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/5"
                                                : isStale
                                                ? "border-amber-200 bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5"
                                                : "border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-900"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isHealthy ? (
                                                isStale ? (
                                                    <Clock className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                                ) : (
                                                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                                                )
                                            ) : (
                                                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                            )}
                                            <div>
                                                <p className="text-sm font-bold text-[#0F172A] dark:text-white">{job.jobName}</p>
                                                <p className="text-xs text-[#64748B] dark:text-gray-400">
                                                    {job.lastRunAt ? timeAgo(job.lastRunAt) : "Never run"}
                                                    {job.emailsSent !== undefined && ` · ${job.emailsSent} emails`}
                                                    {job.day1Sent !== undefined && ` · D1:${job.day1Sent} D3:${job.day3Sent}`}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                                            isHealthy
                                                ? isStale ? "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/20" : "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/20"
                                                : "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-500/20"
                                        }`}>
                                            {isHealthy ? (isStale ? "STALE" : "OK") : "FAIL"}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center text-sm text-gray-500 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                            No cron jobs have run yet.
                        </div>
                    )}
                </div>

                {/* Error Log */}
                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Recent Errors</h3>
                    </div>
                    {recentErrors.length > 0 ? (
                        <div className="space-y-3 max-h-[320px] overflow-y-auto">
                            {recentErrors.map((err, i) => (
                                <div key={`${err.type}-${err.timestamp}-${i}`} className="rounded-xl border border-red-100 dark:border-red-500/10 bg-red-50/50 dark:bg-red-500/5 p-3">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">{err.type}</span>
                                        <span className="text-xs text-[#64748B] dark:text-gray-400">{err.timestamp ? timeAgo(err.timestamp) : ""}</span>
                                    </div>
                                    {err.email && <p className="text-xs text-[#64748B] dark:text-gray-400 mb-1">→ {err.email}</p>}
                                    <p className="text-sm text-red-800 dark:text-red-300 font-mono break-all">{err.error}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-32 flex flex-col items-center justify-center text-sm text-gray-500 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl gap-2">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                            No errors logged. Clean run.
                        </div>
                    )}
                </div>
            </div>

            {/* Two-column layout for posts + newsletters */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Posts Chart */}
                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white mb-4">Top Performing Posts</h3>
                    {chartData.length > 0 ? (
                        <div className="w-full h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                                    <XAxis dataKey="shortTitle" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} stroke="#9CA3AF" />
                                    <YAxis yAxisId="left" orientation="left" stroke="#9CA3AF" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatNumber} />
                                    <Tooltip 
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#1E293B', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Bar yAxisId="left" dataKey="views" name="Views" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="right" dataKey="likes" name="Likes" fill="#EF4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-72 flex items-center justify-center text-sm text-gray-500 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                            Not enough data yet.
                        </div>
                    )}
                </div>

                {/* Newsletter History */}
                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Mail className="w-5 h-5 text-gray-500" />
                        <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Recent Newsletters</h3>
                    </div>
                    
                    {newsletters.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                        <th className="pb-3 font-semibold">Subject</th>
                                        <th className="pb-3 font-semibold">Sent</th>
                                        <th className="pb-3 font-semibold text-right">Delivered</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {newsletters.map((n, i) => (
                                        <tr key={i} className="text-[#0F172A] dark:text-white">
                                            <td className="py-3 pr-4 truncate max-w-[150px]" title={n.subject}>
                                                {n.subject}
                                            </td>
                                            <td className="py-3 text-gray-500 whitespace-nowrap">
                                                {formatDate(n.sentAt)}
                                            </td>
                                            <td className="py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <span className="font-medium text-emerald-600 dark:text-emerald-400">{n.sent}</span>
                                                    {n.failed > 0 && <span className="text-xs text-orange-500 bg-orange-500/10 px-1.5 py-0.5 rounded">+{n.failed} fail</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-sm text-gray-500 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                            No newsletters sent yet.
                        </div>
                    )}
                </div>
            </div>

            {/* Engagement row */}
            <div className="bg-gradient-to-br from-[#16A34A]/10 to-[#15803d]/5 dark:from-[#16A34A]/20 dark:to-transparent border border-[#16A34A]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Community Engagement</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total poll votes cast across the platform.</p>
                </div>
                <div className="text-4xl font-black text-[#16A34A]">
                    {formatNumber(kpis.totalPollVotes)} <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">Votes</span>
                </div>
            </div>
        </div>
    );
}
