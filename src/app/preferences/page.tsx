"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/app/components/Footer";

function PreferencesForm() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";
  
  const [email, setEmail] = useState(emailParam);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [preferences, setPreferences] = useState({
    digest: true,
    newArticles: true,
    productUpdates: false,
    unsubscribed: false,
  });

  useEffect(() => {
    if (email) {
      // Automatically load current preferences if email is provided
      fetchPreferences(email);
    }
  }, [email]);

  const fetchPreferences = async (emailToFetch: string) => {
    try {
      // This will call the API to fetch existing preferences
      const res = await fetch(`/api/preferences?email=${encodeURIComponent(emailToFetch)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (err) {
      console.error("Failed to load preferences", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, preferences }),
      });

      if (res.ok) {
        setMessage("Your email preferences have been updated successfully.");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update preferences.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 sm:px-6">
      <h1 className="text-3xl font-serif text-slate-900 dark:text-white mb-4">
        Email Preferences
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-8 font-sans">
        Manage what you receive in your inbox. We respect your inbox and will only send you what you ask for.
      </p>

      {message && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900 rounded-lg">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-[#1E293B] p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors outline-none"
            placeholder="you@example.com"
            required
          />
        </div>

        {!preferences.unsubscribed && (
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">Subscriptions</h3>
            
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.digest}
                onChange={(e) => setPreferences({ ...preferences, digest: e.target.checked })}
                className="mt-1 h-4 w-4 text-green-600 rounded border-slate-300 focus:ring-green-500 bg-white dark:bg-slate-900"
              />
              <div>
                <span className="block font-medium text-slate-900 dark:text-slate-200">Weekly Digest</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">Our best stories, analysis, and tactics sent every Sunday.</span>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.newArticles}
                onChange={(e) => setPreferences({ ...preferences, newArticles: e.target.checked })}
                className="mt-1 h-4 w-4 text-green-600 rounded border-slate-300 focus:ring-green-500 bg-white dark:bg-slate-900"
              />
              <div>
                <span className="block font-medium text-slate-900 dark:text-slate-200">New Articles</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">Be the first to read new articles the moment they are published.</span>
              </div>
            </label>

            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={preferences.productUpdates}
                onChange={(e) => setPreferences({ ...preferences, productUpdates: e.target.checked })}
                className="mt-1 h-4 w-4 text-green-600 rounded border-slate-300 focus:ring-green-500 bg-white dark:bg-slate-900"
              />
              <div>
                <span className="block font-medium text-slate-900 dark:text-slate-200">Product Updates & Offers</span>
                <span className="block text-sm text-slate-500 dark:text-slate-400">Occasional updates about the platform and special subscriber offers.</span>
              </div>
            </label>
          </div>
        )}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={preferences.unsubscribed}
              onChange={(e) => {
                const isUnsubscribing = e.target.checked;
                setPreferences({
                  digest: !isUnsubscribing,
                  newArticles: !isUnsubscribing,
                  productUpdates: false,
                  unsubscribed: isUnsubscribing,
                });
              }}
              className="mt-1 h-4 w-4 text-red-600 rounded border-slate-300 focus:ring-red-500 bg-white dark:bg-slate-900"
            />
            <div>
              <span className="block font-medium text-red-600 dark:text-red-400">Unsubscribe from everything</span>
              <span className="block text-sm text-slate-500 dark:text-slate-400">You won't receive any more emails from us.</span>
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-medium rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Preferences"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors">
          &larr; Return to Homepage
        </Link>
      </div>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B1120]">
      <main className="flex-1">
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading...</div>}>
          <PreferencesForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
