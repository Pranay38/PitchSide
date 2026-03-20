import { useState, useMemo, useEffect } from "react";
import type { BlogPost } from "../../data/posts";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trophy, Clock, Loader2 } from "lucide-react";

interface Fixture {
    id: number;
    utcDate: string;
    homeTeam: { name: string; crest: string };
    awayTeam: { name: string; crest: string };
    competition: { name: string; emblem: string };
    status: string;
    score: { home: number | null; away: number | null };
}

interface AdminCalendarTabProps {
    posts: BlogPost[];
}

export function AdminCalendarTab({ posts }: AdminCalendarTabProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [fixtures, setFixtures] = useState<Fixture[]>([]);
    const [loadingFixtures, setLoadingFixtures] = useState(false);

    // Fetch fixtures for the current month
    useEffect(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const dateFrom = new Date(year, month, 1).toISOString().split("T")[0];
        const dateTo = new Date(year, month + 1, 0).toISOString().split("T")[0];

        setLoadingFixtures(true);
        fetch(`/api/fixtures?mode=custom&dateFrom=${dateFrom}&dateTo=${dateTo}&competition=PL,CL,PD,BL1,SA`)
            .then(res => res.ok ? res.json() : { matches: [] })
            .then(data => setFixtures(data.matches || []))
            .catch(() => setFixtures([]))
            .finally(() => setLoadingFixtures(false));
    }, [currentDate.getFullYear(), currentDate.getMonth()]);

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const today = new Date();

    const { days, blanksBefore } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const blanksBefore = firstDay;

        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(year, month, i + 1);
            
            // Posts published or scheduled for this day
            const dayPosts = posts.filter(post => {
                // Check publishAt first, then fall back to date
                const postDateStr = post.publishAt || post.date;
                const postDate = new Date(postDateStr);
                return postDate.getFullYear() === year &&
                    postDate.getMonth() === month &&
                    postDate.getDate() === i + 1;
            });

            // Fixtures for this day
            const dayFixtures = fixtures.filter(f => {
                const fDate = new Date(f.utcDate);
                return fDate.getFullYear() === year &&
                    fDate.getMonth() === month &&
                    fDate.getDate() === i + 1;
            });

            return {
                dayNumber: i + 1,
                date,
                isToday: date.toDateString() === today.toDateString(),
                posts: dayPosts,
                fixtures: dayFixtures,
            };
        });

        return { days, blanksBefore };
    }, [currentDate, posts, fixtures]);

    const monthName = currentDate.toLocaleString("default", { month: "long" });
    const year = currentDate.getFullYear();
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 transition-colors">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-[#16A34A]" />
                        Content Calendar
                        {loadingFixtures && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                    </h2>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                        Posts, scheduled drafts & upcoming fixtures at a glance.
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={prevMonth}
                        className="p-2 text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-semibold text-[#0F172A] dark:text-white min-w-[140px] text-center">
                        {monthName} {year}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-2 text-[#64748B] dark:text-gray-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    <button 
                        onClick={() => setCurrentDate(new Date())}
                        className="ml-2 px-3 py-1.5 text-xs font-semibold text-[#16A34A] bg-[#16A34A]/10 hover:bg-[#16A34A]/20 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-4 mb-2">
                {daysOfWeek.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-[#64748B] dark:text-gray-400 uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-4">
                {Array.from({ length: blanksBefore }).map((_, i) => (
                    <div key={`blank-${i}`} className="h-24 sm:h-36 bg-gray-50/50 dark:bg-[#0F172A]/30 rounded-xl border border-transparent"></div>
                ))}

                {days.map(({ dayNumber, isToday, posts: dayPosts, fixtures: dayFixtures }) => (
                    <div 
                        key={dayNumber} 
                        className={`h-24 sm:h-36 rounded-xl border p-2 flex flex-col transition-colors group overflow-hidden ${
                            isToday 
                                ? 'border-[#16A34A] bg-[#16A34A]/5' 
                                : dayFixtures.length > 0
                                ? 'border-blue-200 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-900/10 hover:border-blue-400'
                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] hover:border-[#16A34A]/50'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                                isToday 
                                    ? 'bg-[#16A34A] text-white' 
                                    : 'text-[#0F172A] dark:text-white group-hover:text-[#16A34A]'
                            }`}>
                                {dayNumber}
                            </span>
                            <div className="flex items-center gap-1">
                                {dayFixtures.length > 0 && (
                                    <span className="text-[9px] font-bold text-blue-500 bg-blue-100 dark:bg-blue-500/20 px-1.5 py-0.5 rounded hidden sm:block">
                                        ⚽ {dayFixtures.length}
                                    </span>
                                )}
                                {dayPosts.length > 0 && (
                                    <span className="text-[9px] font-medium text-[#64748B] dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded hidden sm:block">
                                        {dayPosts.length} post{dayPosts.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-1 hidden sm:block">
                            {/* Fixtures */}
                            {dayFixtures.slice(0, 2).map(f => (
                                <div 
                                    key={f.id}
                                    className="text-[10px] px-1.5 py-1 rounded-md border bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 truncate flex items-center gap-1"
                                    title={`${f.homeTeam.name} vs ${f.awayTeam.name} — ${f.competition.name}`}
                                >
                                    <Trophy className="w-2.5 h-2.5 flex-shrink-0" />
                                    {f.homeTeam.name?.split(" ").pop()} v {f.awayTeam.name?.split(" ").pop()}
                                </div>
                            ))}
                            {dayFixtures.length > 2 && (
                                <div className="text-[9px] text-blue-500 text-center">+{dayFixtures.length - 2} more</div>
                            )}

                            {/* Posts */}
                            {dayPosts.map(post => (
                                <div 
                                    key={post.id} 
                                    className={`text-[10px] px-1.5 py-1 rounded-md truncate border flex items-center gap-1 ${
                                        post.publishAt && new Date(post.publishAt) > new Date()
                                            ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-400'
                                            : post.isDraft 
                                            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400' 
                                            : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                    }`}
                                    title={post.title}
                                >
                                    {post.publishAt && new Date(post.publishAt) > new Date() ? (
                                        <Clock className="w-2.5 h-2.5 flex-shrink-0" />
                                    ) : null}
                                    {post.title}
                                </div>
                            ))}
                        </div>

                        {/* Mobile indicator dots */}
                        <div className="flex-1 flex flex-wrap gap-1 sm:hidden mt-1 content-start">
                            {dayFixtures.map(f => (
                                <div key={f.id} className="w-2 h-2 rounded-full bg-blue-500" />
                            ))}
                            {dayPosts.map(post => (
                                <div 
                                    key={post.id}
                                    className={`w-2 h-2 rounded-full ${
                                        post.publishAt && new Date(post.publishAt) > new Date()
                                            ? 'bg-cyan-500'
                                            : post.isDraft ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-4 sm:gap-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    Published
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    Draft
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                    Scheduled
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    Fixtures
                </div>
            </div>
        </div>
    );
}
