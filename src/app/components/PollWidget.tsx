import { useState, useEffect } from "react";
import { CheckCircle2, BarChart3 } from "lucide-react";

interface PollOption {
    text: string;
    votes: number;
}

interface PollData {
    question: string;
    options: PollOption[];
}

interface PollWidgetProps {
    postId: string;
    poll: PollData;
}

export function PollWidget({ postId, poll }: PollWidgetProps) {
    // Check local storage to see if user already voted on this specific poll
    const storageKey = `poll_voted_${postId}`;
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [currentPoll, setCurrentPoll] = useState<PollData>(poll);

    useEffect(() => {
        const storedVote = localStorage.getItem(storageKey);
        if (storedVote !== null) {
            setHasVoted(true);
            setSelectedOption(parseInt(storedVote, 10));
        }
    }, [storageKey]);

    const totalVotes = currentPoll.options.reduce((sum, opt) => sum + opt.votes, 0);

    const handleVote = (optionIndex: number) => {
        if (hasVoted) return;

        // In a real app with a backend, we would dispatch a POST request to update the vote count on the server here.
        // For MVP, we'll update the local state and persist the 'voted' status locally.
        const updatedOptions = [...currentPoll.options];
        updatedOptions[optionIndex].votes += 1;

        setCurrentPoll({
            ...currentPoll,
            options: updatedOptions
        });

        setHasVoted(true);
        setSelectedOption(optionIndex);
        localStorage.setItem(storageKey, optionIndex.toString());
    };

    return (
        <div className="my-8 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-accent-theme" />
                    Fan Poll
                </h3>
                <span className="text-xs font-medium text-[#94A3B8] bg-gray-200 dark:bg-gray-700/50 px-2 py-1 rounded-md">
                    {totalVotes} {totalVotes === 1 ? 'Vote' : 'Votes'}
                </span>
            </div>

            <div className="p-6">
                <h4 className="text-lg font-bold text-[#0F172A] dark:text-white mb-6">
                    {currentPoll.question}
                </h4>

                <div className="space-y-3">
                    {currentPoll.options.map((option, idx) => {
                        const percentage = totalVotes > 0
                            ? Math.round((option.votes / totalVotes) * 100)
                            : 0;

                        const isSelected = selectedOption === idx;

                        return (
                            <div key={idx} className="relative">
                                {/* Vote Button View */}
                                {!hasVoted ? (
                                    <button
                                        onClick={() => handleVote(idx)}
                                        className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 hover:border-accent-theme hover:bg-accent-theme/5 dark:hover:bg-accent-theme/10 transition-all group flex items-center justify-between"
                                    >
                                        <span className="text-sm font-medium text-[#0F172A] dark:text-gray-200 group-hover:text-accent-theme transition-colors">
                                            {option.text}
                                        </span>
                                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-accent-theme transition-colors" />
                                    </button>
                                ) : (
                                    /* Results View */
                                    <div className={`relative overflow-hidden w-full px-4 py-3 rounded-xl border-2 transition-all ${isSelected ? 'border-accent-theme bg-accent-theme/5' : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0F172A]/30'}`}>

                                        {/* Progress Bar Background */}
                                        <div
                                            className={`absolute inset-0 opacity-10 transition-all duration-1000 ease-out ${isSelected ? 'bg-accent-theme' : 'bg-gray-400 dark:bg-gray-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        />

                                        <div className="relative flex items-center justify-between z-10">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${isSelected ? 'text-accent-theme' : 'text-[#0F172A] dark:text-gray-300'}`}>
                                                    {option.text}
                                                </span>
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-accent-theme" />}
                                            </div>
                                            <span className={`text-sm font-bold ${isSelected ? 'text-accent-theme' : 'text-[#64748B] dark:text-gray-400'}`}>
                                                {percentage}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
