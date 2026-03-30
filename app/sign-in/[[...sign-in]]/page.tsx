"use client";
import dynamic from "next/dynamic";
const SignInPage = dynamic(() => import("@/app/components/ui/login-1"), { ssr: false });
export default function SignIn() { return <SignInPage />; }
