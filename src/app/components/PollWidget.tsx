import { useState, useEffect } from "react";
import { AlertCircle, BarChart3, CheckCircle2, Loader2 } from "lucide-react";
import { getDeviceId } from "../lib/deviceId";

interface PollWidgetOption {
    id?: string;
    text: string;
    votes: number;
}

interface PollWidgetData {
    question: string;
    options: PollWidgetOption[];
    userVotedOptionId?: string | null;
}

interface PollWidgetProps {
    pollId: string;
    poll: PollWidgetData;
    title?: string;
    description?: string;
    className?: string;
    voteMode?: "local" | "remote";
    onVote?: (optionId: string, optionIndex: number) => Promise<PollWidgetData | null>;
}

export function PollWidget({
    pollId,
    poll,
    title = "Poll",
    description = "",
    className = "my-8",
    voteMode = "local",
    onVote,
}: PollWidgetProps) {
    const [hasVoted, setHasVoted] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [currentPoll, setCurrentPoll] = useState(poll);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        // Ensure device ID is captured across visits
        if (voteMode === "remote") getDeviceId();

        setCurrentPoll(poll);
        setError("");
        
        // Use backend state if provided, otherwise assume not voted
        if (poll.userVotedOptionId) {
            setHasVoted(true);
            const idx = poll.options.findIndex(o => o.id === poll.userVotedOptionId);
            setSelectedOption(idx >= 0 ? idx : null);
        } else {
            setHasVoted(false);
            setSelectedOption(null);
        }
    }, [poll, voteMode]);

    const totalVotes = currentPoll.options.reduce((sum, opt) => sum + opt.votes, 0);

    const handleVote = async (optionIndex: number) => {
        if (hasVoted || submitting) return;

        setSubmitting(true);
        setError("");

        const optionId = currentPoll.options[optionIndex]?.id || `option-${optionIndex + 1}`;
        const previousPoll = { ...currentPoll };

        // 1. Optimistic Update
        const updatedOptions = [...currentPoll.options];
        updatedOptions[optionIndex] = {
            ...updatedOptions[optionIndex],
            votes: updatedOptions[optionIndex].votes + 1,
        };
        const activeOptimisticPoll = {
             ...currentPoll,
             options: updatedOptions,
             userVotedOptionId: optionId
        };
        setCurrentPoll(activeOptimisticPoll);
        setHasVoted(true);
        setSelectedOption(optionIndex);

        // 2. Network Request
        try {
            if (voteMode === "remote" && onVote) {
                const nextPoll = await onVote(optionId, optionIndex);
                if (nextPoll) {
                    setCurrentPoll(nextPoll);
                } else {
                    throw new Error("Could not save vote.");
                }
            }
        } catch (voteError: any) {
            // 3. Revert on failure
            setCurrentPoll(previousPoll);
            setHasVoted(false);
            setSelectedOption(null);
            setError(voteError?.message || "Could not record your vote.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={`${className} bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden animate-fade-in`}>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#16A34A]" />
                    {title}
                </h3>
                <span className="text-xs font-medium text-[#94A3B8] bg-gray-200 dark:bg-gray-700/50 px-2 py-1 rounded-md">
                    {totalVotes} {totalVotes === 1 ? 'Vote' : 'Votes'}
                </span>
            </div>

            <div className="p-6">
                {description && (
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mb-3">
                        {description}
                    </p>
                )}
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
                                        onClick={() => { void handleVote(idx); }}
                                        disabled={submitting}
                                        className="w-full text-left px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-800 hover:border-[#16A34A] hover:bg-[#16A34A]/5 dark:hover:bg-[#16A34A]/10 transition-all group flex items-center justify-between"
                                    >
                                        <span className="text-sm font-medium text-[#0F172A] dark:text-gray-200 group-hover:text-[#16A34A] transition-colors">
                                            {option.text}
                                        </span>
                                        {submitting && selectedOption === null ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-[#16A34A]" />
                                        ) : (
                                            <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600 group-hover:border-[#16A34A] transition-colors" />
                                        )}
                                    </button>
                                ) : (
                                    /* Results View */
                                    <div className={`relative overflow-hidden w-full px-4 py-3 rounded-xl border-2 transition-all ${isSelected ? 'border-[#16A34A] bg-[#16A34A]/5' : 'border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#0F172A]/30'}`}>

                                        {/* Progress Bar Background */}
                                        <div
                                            className={`absolute inset-0 opacity-10 transition-all duration-1000 ease-out ${isSelected ? 'bg-[#16A34A]' : 'bg-gray-400 dark:bg-gray-500'}`}
                                            style={{ width: `${percentage}%` }}
                                        />

                                        <div className="relative flex items-center justify-between z-10">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold ${isSelected ? 'text-[#16A34A]' : 'text-[#0F172A] dark:text-gray-300'}`}>
                                                    {option.text}
                                                </span>
                                                {isSelected && <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />}
                                            </div>
                                            <span className={`text-sm font-bold ${isSelected ? 'text-[#16A34A]' : 'text-[#64748B] dark:text-gray-400'}`}>
                                                {percentage}%
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {error && (
                    <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
