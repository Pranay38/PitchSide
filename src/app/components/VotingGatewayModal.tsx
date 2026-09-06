import { useState } from "react";
import { X, Loader2, Mail, Lock } from "lucide-react";

interface VotingGatewayModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (email: string) => void;
    featureName?: string; // e.g. "cast your vote" or "make your prediction"
}

export function VotingGatewayModal({ isOpen, onClose, onComplete, featureName = "cast your vote" }: VotingGatewayModalProps) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !email.includes("@")) {
            setError("Please enter a valid email address.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/subscribers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            // We treat both 200/201 (success) and 409 (already subscribed) as success to let them pass
            if (res.ok || res.status === 409) {
                // Save to local storage so they aren't asked again
                localStorage.setItem("pitchside_subscriber_email", email);
                onComplete(email);
            } else {
                const data = await res.json();
                setError(data.error || "Failed to subscribe. Please try again.");
            }
        } catch (err) {
            setError("A network error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white dark:bg-[#0F172A] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-6 sm:p-8 animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>

                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white mb-2">
                        Join the Inner Circle
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                        Join 5,000+ football fanatics. Enter your email to {featureName} and get our tactical breakdowns sent straight to your inbox.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email address"
                                disabled={loading}
                                className="w-full bg-gray-50 dark:bg-[#1E293B] border border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500 rounded-xl px-11 py-3.5 text-sm text-[#0F172A] dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                                required
                            />
                        </div>
                        {error && <p className="text-xs text-red-500 mt-2 font-medium">{error}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
                    </button>
                    <p className="text-[10px] text-center text-gray-400 mt-3 font-medium">
                        No spam. Unsubscribe anytime.
                    </p>
                </form>
            </div>
        </div>
    );
}
