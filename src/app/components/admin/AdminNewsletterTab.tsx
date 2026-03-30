import { useState, useEffect } from "react";
import { Mail, Send, Users, LoaderCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { AdminEmptyState } from "./AdminEmptyState";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pitchside_admin_auth");
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function AdminNewsletterTab() {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("<p>Welcome to this week's digest!</p>");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    void fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const res = await fetch("/api/subscribers", {
        headers: getAuthHeaders(),
        cache: "no-store",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSubscribers(data.subscribers || []);
        return;
      }
      throw new Error(data.error || "Failed to load subscribers");
    } catch (e) {
      console.error(e);
      toast.error("Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  };

  const handleSendDigest = async () => {
    if (!subject.trim() || !content.trim()) {
      toast.error("Subject and content are required.");
      return;
    }
    
    if (!window.confirm(`Are you sure you want to blast this email to ${subscribers.length} subscribers?`)) return;

    setSending(true);
    try {
      const res = await fetch("/api/subscribers?action=send-digest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          subject,
          htmlContent: content
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Digest sent!");
        setSubject("");
        setContent("");
      } else {
        toast.error(data.error || "Failed to send digest");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to send digest");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <LoaderCircle className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-500" />
            Newsletter & Digests
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Send email blasts to all your active subscribers.
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
          <Users className="w-4 h-4" />
          <span className="font-semibold">{subscribers.length} Subscribers</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="font-semibold text-[#0F172A] dark:text-white mb-4">Compose Digest</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. This Week's Top Tactics & Transfers"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white mb-4"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  HTML Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={15}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white font-mono text-sm leading-relaxed"
                />
                <p className="text-xs text-gray-500 mt-2">
                  You can use HTML tags (e.g., &lt;strong&gt;, &lt;h1&gt;, &lt;a href="..."&gt;) for formatting.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSendDigest}
                  disabled={sending || subscribers.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg font-medium transition-all disabled:opacity-50"
                >
                  {sending ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Sending..." : "Blast Digest"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0F172A] rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
            <h3 className="font-semibold text-[#0F172A] dark:text-white mb-4 flex items-center justify-between">
              Subscribers
              <span className="text-xs font-normal text-gray-500">{subscribers.length} total</span>
            </h3>
            
            {subscribers.length === 0 ? (
              <AdminEmptyState
                icon={Users}
                title="No subscribers yet"
                description="Share your site link to start building your audience!"
                action={
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.origin);
                      toast.success("Site link copied to clipboard!");
                    }}
                    className="text-sm font-semibold px-5 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 active:scale-95 text-gray-700 dark:text-gray-200 rounded-lg transition-all shadow-sm"
                  >
                    Copy Website Link
                  </button>
                }
              />
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {subscribers.map((sub, i) => (
                  <div key={i} className="flex flex-col p-3 rounded-lg bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-gray-800">
                    <span className="text-sm font-medium text-[#0F172A] dark:text-gray-200 truncate">
                      {sub.email}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Joined {new Date(sub.subscribedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
