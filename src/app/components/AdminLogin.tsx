import { useEffect, useState } from "react";
import { SignIn, useAuth, useUser } from "@clerk/clerk-react";
import { adminLogin } from "../lib/postStorage";
import { toast } from "sonner";
import { Lock } from "lucide-react";

interface AdminLoginProps {
    onLogin: () => void;
}

export function AdminLogin({ onLogin }: AdminLoginProps) {
    const { isLoaded, isSignedIn, signOut, getToken } = useAuth();
    const { user } = useUser();
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            const checkAdmin = async () => {
                const primaryEmail = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
                const emailAddress = primaryEmail?.emailAddress?.toLowerCase() || "";
                
                if (emailAddress !== "pranayagarwal382@gmail.com") {
                    toast.error("Unauthorized: Admin access is restricted to Pranay's email.");
                    await signOut();
                    return;
                }
                
                setVerifying(true);
                try {
                    const token = await getToken();
                    if (!token) throw new Error("No token");
                    
                    const result = await adminLogin(token);
                    if (result.ok) {
                        onLogin();
                    } else {
                        toast.error(result.error || "Failed to authenticate with backend.");
                        await signOut();
                    }
                } catch {
                    toast.error("Authentication server error");
                    await signOut();
                }
                setVerifying(false); // will unmount if successful via onLogin() but catch needed
            };
            checkAdmin();
        }
    }, [isLoaded, isSignedIn, user, signOut, getToken, onLogin]);

    if (!isLoaded || verifying || (isSignedIn && !verifying)) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center p-4">
                <div className="flex flex-col items-center">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#16A34A] border-t-transparent mb-4" />
                    <p className="text-[#64748B] dark:text-gray-400 font-medium tracking-wide">
                        {verifying ? "Verifying admin credentials..." : "Loading authentication..."}
                    </p>
                </div>
            </div>
        );
    }

    if (!isSignedIn) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B1120] flex flex-col items-center justify-center p-4 transition-colors duration-300">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#15803d] mb-4 shadow-lg shadow-[#16A34A]/20">
                        <Lock className="w-7 h-7 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-[#0F172A] dark:text-white">
                        The Touchline Dribble Admin
                    </h1>
                    <p className="text-sm text-[#64748B] dark:text-gray-400 mt-2">
                        Admin access is restricted to authenticated staff.
                    </p>
                </div>
                
                <div className="w-full max-w-sm flex justify-center">
                    <SignIn routing="hash" />
                </div>
            </div>
        );
    }

    return null;
}
