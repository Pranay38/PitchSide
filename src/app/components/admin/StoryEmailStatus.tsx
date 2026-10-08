"use client";
import { useEffect, useState } from "react";

interface DeliveryStatus {
  state: string;
  accepted: number;
  pending: number;
  failed: number;
  skipped: number;
  review: number;
  error?: string;
}
export function StoryEmailStatus({ storyId, isDraft, updatedAt }: { storyId: string; isDraft: boolean; updatedAt: string }) {
  const [status, setStatus] = useState<DeliveryStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    fetch(`/api/stories?action=email-status&id=${encodeURIComponent(storyId)}`, { headers: { Authorization: `Bearer ${localStorage.getItem("pitchside_admin_auth")}` } })
      .then(async response => { if (!response.ok) throw new Error("Could not load email status."); return response.json(); })
      .then(next => { if (active) { setStatus(next); setError(""); } })
      .catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [storyId, updatedAt, isDraft]);
  async function retry() {
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/stories?action=retry-emails&id=${encodeURIComponent(storyId)}`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("pitchside_admin_auth")}`, "x-csrf-token": "1" } });
      if (!response.ok) throw new Error("Could not retry story emails.");
      setStatus(await response.json());
    } catch (err) { setError(err instanceof Error ? err.message : "Could not retry story emails."); }
    finally { setBusy(false); }
  }
  return <div className="mt-4 text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
    {status && status.state !== "not-scheduled" && <>
      <p>Email: {status.accepted} accepted by provider · {status.pending} pending · {status.failed} failed{status.skipped > 0 ? ` · ${status.skipped} opted out` : ""}</p>
      {status.error && <p className="mt-1 text-amber-700 dark:text-amber-400">{status.error}</p>}
      {status.review > 0 && <p className="mt-1 text-amber-700 dark:text-amber-400">{status.review} delivery attempt(s) need review in Resend before resending.</p>}
      {isDraft && status.state !== "complete" && <p className="mt-1">Delivery is paused while this story is a draft.</p>}
      {!isDraft && (status.state === "pending" || status.state === "failed") && <button type="button" disabled={busy} onClick={retry} className="mt-1 min-h-11 text-green-700 underline disabled:opacity-50 dark:text-green-400">{busy ? "Sending…" : "Retry pending / failed emails"}</button>}
    </>}
    {error && <p role="alert">{error}</p>}
  </div>;
}
