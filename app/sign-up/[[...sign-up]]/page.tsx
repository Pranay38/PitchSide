"use client";
import dynamic from "next/dynamic";
const SignUpPage = dynamic(() => import("@/app/components/ui/login-1"), { ssr: false });
export default function SignUp() { return <SignUpPage />; }
