import { useState } from "react";
import { adminLogin } from "../lib/postStorage";
import { Lock, Eye, EyeOff } from "lucide-react";

interface AdminLoginProps {
    onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminLogin(password)) {
            onLogin();
        } else {
            setError("Incorrect password");
            setPassword("");
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-sm">
                <div className="bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl p-8 transition-colors duration-300">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#15803d] mb-4 shadow-lg shadow-[#16A34A]/20">
                            <Lock className="w-7 h-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
                            The Touchline Dribble Admin
                        </h1>
                        <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                            Enter your password to manage posts
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-[#0F172A] dark:text-white mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError("");
                                    }}
                                    placeholder="Enter admin password"
                                    className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-[#0F172A] text-[#0F172A] dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/50 focus:border-[#16A34A] transition-all text-sm"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {error && (
                                <p className="text-red-500 text-xs mt-2">{error}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            className="w-full py-3 bg-[#16A34A] text-white rounded-xl font-medium hover:bg-[#15803d] transition-all duration-200 hover:shadow-lg hover:shadow-[#16A34A]/25 text-sm"
                        >
                            Sign In
                        </button>
                    </form>

                    <p className="text-xs text-center text-[#94A3B8] dark:text-gray-500 mt-6">
                        Default password: <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[#16A34A]">pitchside2026</code>
                    </p>
                </div>
            </div>
        </div>
    );
}
