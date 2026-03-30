"use client";
import dynamic from "next/dynamic";
const AdminGuard = dynamic(() => import("@/app/components/AdminGuard").then(m => ({ default: m.AdminGuard })), { ssr: false });
export default function AdminPage() { return <AdminGuard />; }
