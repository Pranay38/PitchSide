import { useState, useEffect } from "react";
import { Users, FileText, MessageSquare, Flame, BarChart3, Mail, RefreshCw, AlertCircle } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

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
}

export function AdminAnalyticsTab() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = async () => {
        setLoading(true);
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

    const { kpis, topPosts, newsletters } = data;

    // Helper to format large numbers (e.g., 1500 -> 1.5k)
    const formatNumber = (num: number) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    };

    // Format date for the newsletter table
    const formatDate = (isoString: string) => {
        return new Date(isoString).toLocaleDateString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    // Prepare chart data (truncate long titles)
    const chartData = topPosts.map(p => ({
        ...p,
        shortTitle: p.title.length > 25 ? p.title.substring(0, 25) + "..." : p.title
    }));

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-[#16A34A]" /> Platform Analytics
                    </h1>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                        A bird's-eye view of your community engagement.
                    </p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    className="p-2 text-gray-400 hover:text-[#16A34A] bg-gray-100 dark:bg-gray-800 rounded-lg transition-colors"
                    title="Refresh Data"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg text-blue-500">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Subscribers</span>
                    </div>
                    <span className="text-2xl font-bold text-[#0F172A] dark:text-white mt-auto">{formatNumber(kpis.totalSubscribers)}</span>
                </div>
                
                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg text-emerald-500">
                            <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Published Posts</span>
                    </div>
                    <span className="text-2xl font-bold text-[#0F172A] dark:text-white mt-auto">{formatNumber(kpis.totalPosts)}</span>
                </div>

                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-purple-50 dark:bg-purple-500/10 rounded-lg text-purple-500">
                            <MessageSquare className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Total Comments</span>
                    </div>
                    <span className="text-2xl font-bold text-[#0F172A] dark:text-white mt-auto">{formatNumber(kpis.totalComments)}</span>
                </div>

                <div className="bg-white dark:bg-[#0F172A] p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-orange-50 dark:bg-orange-500/10 rounded-lg text-orange-500">
                            <Flame className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Active Debates</span>
                    </div>
                    <span className="text-2xl font-bold text-[#0F172A] dark:text-white mt-auto">{formatNumber(kpis.totalDebates)}</span>
                </div>
            </div>

            {/* Engagement Metrics row 2 */}
            <div className="bg-gradient-to-br from-[#16A34A]/10 to-[#15803d]/5 dark:from-[#16A34A]/20 dark:to-transparent border border-[#16A34A]/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Community Engagement</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total poll votes cast across the platform.</p>
                </div>
                <div className="text-4xl font-black text-[#16A34A]">
                    {formatNumber(kpis.totalPollVotes)} <span className="text-lg font-semibold text-gray-500 dark:text-gray-400">Votes</span>
                </div>
            </div>

            {/* Two-column layout for details */}
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
        </div>
    );
}
