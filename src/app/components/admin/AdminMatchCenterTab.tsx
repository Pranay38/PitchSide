import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Code, Copy, Check } from "lucide-react";
import type { StadiumMatchData } from "../StadiumMatchCenter";

const DEFAULT_JSON = `{
  "events": [
    { "id": "e1", "type": "goal", "minute": "23'", "team": "home", "player": "Player Name" },
    { "id": "c1", "type": "commentary", "minute": "45'", "team": "neutral", "text": "What a half!" }
  ],
  "stats": [
    { "label": "Possession", "home": 60, "away": 40, "isPercentage": true },
    { "label": "Shots", "home": 12, "away": 5 }
  ],
  "lineups": {
    "home": { "formation": "4-3-3", "startingXI": [], "bench": [] },
    "away": { "formation": "4-2-3-1", "startingXI": [], "bench": [] }
  }
}`;

export function AdminMatchCenterTab() {
  const [cards, setCards] = useState<StadiumMatchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCard, setEditingCard] = useState<Partial<StadiumMatchData> | null>(null);
  const [rawJson, setRawJson] = useState(DEFAULT_JSON);
  const [jsonError, setJsonError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const res = await fetch("/api/match-cards");
      if (res.ok) {
        setCards(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    try {
      let parsedExtras = {};
      if (rawJson.trim()) {
        try {
          parsedExtras = JSON.parse(rawJson);
          setJsonError("");
        } catch (err) {
          setJsonError("Invalid JSON syntax in advanced data");
          return;
        }
      }

      const payload = { ...editingCard, ...parsedExtras };
      const isNew = !payload.id;
      const url = isNew ? "/api/match-cards" : `/api/match-cards?id=${payload.id}`;

      const res = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminPass")}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingCard(null);
        fetchCards();
      } else {
        alert("Failed to save match center");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving match center");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this match center?")) return;
    try {
      const res = await fetch(`/api/match-cards?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("adminPass")}` },
      });
      if (res.ok) fetchCards();
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (card: StadiumMatchData) => {
    const { events, stats, lineups, ...core } = card;
    setEditingCard(core);
    setRawJson(JSON.stringify({ events: events || [], stats: stats || [], lineups: lineups || {} }, null, 2));
    setJsonError("");
  };

  const startNew = () => {
    setEditingCard({
      homeTeam: "", awayTeam: "",
      homeScore: 0, awayScore: 0,
      competition: "", venue: "",
      status: "upcoming", minute: "",
      matchDate: new Date().toISOString()
    });
    setRawJson(DEFAULT_JSON);
    setJsonError("");
  };

  const copyEmbed = (id: string) => {
    navigator.clipboard.writeText(`[match-center id="${id}"]`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black font-outfit text-[#0F172A] dark:text-white">Match Centers</h2>
          <p className="text-gray-500">Create stadium-style match setups to embed in articles.</p>
        </div>
        {!editingCard && (
          <button
            onClick={startNew}
            className="flex items-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2 text-sm font-bold text-white hover:bg-[#15803d]"
          >
            <Plus className="h-4 w-4" /> New Match
          </button>
        )}
      </div>

      {editingCard ? (
        <form onSubmit={handleSave} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-[#0F172A]">
          <h3 className="mb-4 text-lg font-bold text-[#0F172A] dark:text-white">
            {editingCard.id ? "Edit Match" : "New Match"}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Home Team</label>
              <input required type="text" value={editingCard.homeTeam || ""} onChange={e => setEditingCard({ ...editingCard, homeTeam: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-[#16A34A] dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Away Team</label>
              <input required type="text" value={editingCard.awayTeam || ""} onChange={e => setEditingCard({ ...editingCard, awayTeam: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-[#16A34A] dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Home Score</label>
              <input type="number" value={editingCard.homeScore || 0} onChange={e => setEditingCard({ ...editingCard, homeScore: parseInt(e.target.value) || 0 })} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-[#16A34A] dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Away Score</label>
              <input type="number" value={editingCard.awayScore || 0} onChange={e => setEditingCard({ ...editingCard, awayScore: parseInt(e.target.value) || 0 })} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-[#16A34A] dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Status</label>
              <select value={editingCard.status || "upcoming"} onChange={e => setEditingCard({ ...editingCard, status: e.target.value as any })} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-[#16A34A] dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                <option value="upcoming">Upcoming</option>
                <option value="live">Live</option>
                <option value="finished">Finished</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Minute / Time (e.g. 67' or FT)</label>
              <input type="text" value={editingCard.minute || ""} onChange={e => setEditingCard({ ...editingCard, minute: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-[#16A34A] dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Competition</label>
              <input type="text" value={editingCard.competition || ""} onChange={e => setEditingCard({ ...editingCard, competition: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-[#16A34A] dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-bold text-gray-700 dark:text-gray-300">Date (ISO String)</label>
              <input type="text" value={editingCard.matchDate || ""} onChange={e => setEditingCard({ ...editingCard, matchDate: e.target.value })} className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 outline-none focus:border-[#16A34A] dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-1 flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
              <Code className="h-4 w-4" /> Advanced Data (JSON)
            </label>
            <p className="mb-2 text-xs text-gray-500">Edit events, stats, and lineups directly via JSON for ultimate control.</p>
            <textarea
              rows={12}
              value={rawJson}
              onChange={e => setRawJson(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-gray-900 p-4 font-mono text-sm text-green-400 outline-none focus:border-[#16A34A] dark:border-gray-700"
            />
            {jsonError && <p className="mt-1 text-sm text-red-500">{jsonError}</p>}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={() => setEditingCard(null)} className="rounded-xl border border-gray-200 px-6 py-2 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-[#16A34A] px-6 py-2 text-sm font-bold text-white hover:bg-[#15803d]">
              Save Match Center
            </button>
          </div>
        </form>
      ) : (
        <div className="grid gap-4">
          {cards.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800 dark:bg-[#0F172A]">
              <p className="text-gray-500">No match centers yet.</p>
            </div>
          ) : (
            cards.map(card => (
              <div key={card.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#0F172A] shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#16A34A]">{card.competition}</span>
                    <span className="text-xs text-gray-500">• {new Date(card.matchDate).toLocaleDateString()}</span>
                  </div>
                  <h4 className="text-lg font-black font-outfit text-[#0F172A] dark:text-white">
                    {card.homeTeam} {card.homeScore} - {card.awayScore} {card.awayTeam}
                  </h4>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyEmbed(card.id)}
                    className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  >
                    {copiedId === card.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedId === card.id ? "Copied" : "Copy Embed tag"}
                  </button>
                  <button onClick={() => startEdit(card)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(card.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
