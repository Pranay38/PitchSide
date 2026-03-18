import { useState, useMemo } from "react";
import type { BlogPost } from "../../data/posts";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText } from "lucide-react";
import { Link } from "react-router";

interface AdminCalendarTabProps {
    posts: BlogPost[];
}

export function AdminCalendarTab({ posts }: AdminCalendarTabProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

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

        // Adjust for Monday start week (0=Mon, 6=Sun) instead of Sunday start (0=Sun, 6=Sat)
        // If we want Sunday start, blanksBefore = firstDay
        const blanksBefore = firstDay;

        const days = Array.from({ length: daysInMonth }, (_, i) => {
            const date = new Date(year, month, i + 1);
            
            // Find posts for this specific day
            const dayPosts = posts.filter(post => {
                const postDate = new Date(post.date);
                return postDate.getFullYear() === year &&
                    postDate.getMonth() === month &&
                    postDate.getDate() === i + 1;
            });

            return {
                dayNumber: i + 1,
                date,
                isToday: date.toDateString() === today.toDateString(),
                posts: dayPosts
            };
        });

        return { days, blanksBefore };
    }, [currentDate, posts]);

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
                    </h2>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                        Track past posts and scheduled drafts visually.
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
                    <div key={`blank-${i}`} className="h-24 sm:h-32 bg-gray-50/50 dark:bg-[#0F172A]/30 rounded-xl border border-transparent"></div>
                ))}

                {days.map(({ dayNumber, date, isToday, posts: dayPosts }) => (
                    <div 
                        key={dayNumber} 
                        className={`h-24 sm:h-32 rounded-xl border p-2 flex flex-col transition-colors group overflow-hidden ${
                            isToday 
                                ? 'border-[#16A34A] bg-[#16A34A]/5' 
                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0F172A] hover:border-[#16A34A]/50'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full ${
                                isToday 
                                    ? 'bg-[#16A34A] text-white' 
                                    : 'text-[#0F172A] dark:text-white group-hover:text-[#16A34A]'
                            }`}>
                                {dayNumber}
                            </span>
                            {dayPosts.length > 0 && (
                                <span className="text-xs font-medium text-[#64748B] dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-md hidden sm:block">
                                    {dayPosts.length} post{dayPosts.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-1 hidden sm:block">
                            {dayPosts.map(post => (
                                <div 
                                    key={post.id} 
                                    className={`text-[10px] sm:text-xs px-2 py-1.5 rounded-md truncate border ${
                                        post.isDraft 
                                            ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-700 dark:text-amber-400' 
                                            : 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                                    }`}
                                    title={post.title}
                                >
                                    {post.title}
                                </div>
                            ))}
                        </div>

                        {/* Mobile indicator dots */}
                        <div className="flex-1 flex flex-wrap gap-1 sm:hidden mt-1 content-start">
                            {dayPosts.map(post => (
                                <div 
                                    key={post.id}
                                    className={`w-2 h-2 rounded-full ${post.isDraft ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-end gap-6 border-t border-gray-100 dark:border-gray-800 pt-6">
                <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    Published
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-[#64748B] dark:text-gray-400">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    Draft / Scheduled
                </div>
            </div>
        </div>
    );
}
