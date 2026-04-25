"use client";
import { Link } from "@/lib/router-compat";
import { Flag, Home, Library } from "lucide-react";
import { SEO } from "../components/SEO";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { GlowButton } from "../components/ui/GlowButton";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-[#0B1120] transition-colors duration-300">
      <SEO title="Page Not Found" description="The page you are looking for does not exist." />
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-red-500/20 blur-[50px] rounded-full" />
          <Flag className="w-24 h-24 text-red-500 relative z-10" />
        </div>

        <h1 className="mb-4 text-5xl font-black font-outfit tracking-tight text-slate-900 dark:text-white sm:text-7xl">
          OFFSIDE!
        </h1>
        
        <p className="mb-8 max-w-lg text-lg text-slate-600 dark:text-slate-400">
          Looks like this URL strayed beyond the last defender. The linesman's flag is up
          and this page has been ruled out.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center mt-4">
          <GlowButton href="/">
            Back to Pitch
          </GlowButton>
          
          <Link
            to="/archive"
            className="flex items-center justify-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 px-6 py-3.5 text-base font-bold text-slate-900 dark:text-white transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
          >
            <Library className="w-5 h-5" />
            Read Latest News
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
