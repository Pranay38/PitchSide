import { useState, useEffect } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

const ADMIN_KEY = "pitchside_admin_auth";

interface Fixture {
    opp: string;
    h: boolean;
    diff: 1 | 2 | 3;
}

interface TitleRaceTeam {
    id: string;
    name: string;
    short: string;
    color: string;
    pts: number;
    played: number;
    gd: number;
    w: number;
    d: number;
    l: number;
    form: string[];
    remaining: Fixture[];
    verdict: string;
}

export function AdminTitleRaceTab() {
    const [teams, setTeams] = useState<TitleRaceTeam[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/title-race");
                if (res.ok) {
                    const data = await res.json();
                    setTeams(data.teams || []);
                }
            } catch (err) {
                toast.error("Failed to load Title Race Configuration");
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/title-race", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem(ADMIN_KEY) || ""}`,
                },
                body: JSON.stringify({ teams }),
            });
            if (res.ok) {
                toast.success("Title Race Tracker updated successfully!");
            } else {
                toast.error("Failed to update Title Race Tracker.");
            }
        } catch (error) {
            toast.error("Network error while saving.");
        } finally {
            setSaving(false);
        }
    };

    const addTeam = () => {
        setTeams([
            ...teams,
            {
                id: `team_${Date.now()}`,
                name: "New Team",
                short: "NEW",
                color: "#C8FF00",
                pts: 0,
                played: 0,
                gd: 0,
                w: 0,
                d: 0,
                l: 0,
                form: ["W", "D", "L", "W", "W"],
                remaining: [],
                verdict: "Still in it",
            },
        ]);
    };

    const removeTeam = (teamId: string) => {
        if (!window.confirm("Remove this team?")) return;
        setTeams(teams.filter(t => t.id !== teamId));
    };

    const updateTeam = (teamId: string, updates: Partial<TitleRaceTeam>) => {
        setTeams(teams.map(t => t.id === teamId ? { ...t, ...updates } : t));
    };

    const addFixture = (teamId: string) => {
        updateTeam(teamId, {
            remaining: [
                ...teams.find(t => t.id === teamId)!.remaining,
                { opp: "OPP", h: true, diff: 2 }
            ]
        });
    };

    const removeFixture = (teamId: string, fixtureIndex: number) => {
        const team = teams.find(t => t.id === teamId)!;
        updateTeam(teamId, {
            remaining: team.remaining.filter((_, idx) => idx !== fixtureIndex)
        });
    };

    const updateFixture = (teamId: string, fixtureIndex: number, updates: Partial<Fixture>) => {
        const team = teams.find(t => t.id === teamId)!;
        updateTeam(teamId, {
            remaining: team.remaining.map((f, idx) => idx === fixtureIndex ? { ...f, ...updates } : f)
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Title Race configuration...</div>;

    return (
        <div className="bg-white dark:bg-[#09090B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold font-outfit text-[#09090B] dark:text-white">Title Race Manager</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage points, form, and remaining fixtures (under 3 mins to update!).</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#C8FF00] text-black rounded-xl font-bold text-sm hover:bg-[#b5e600] transition-all disabled:opacity-50"
                >
                    <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#09090B] dark:text-white">Teams</h3>
                <button
                    onClick={addTeam}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 dark:bg-zinc-800 dark:text-zinc-300 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Add Team
                </button>
            </div>

            <div className="space-y-6">
                {teams.map((team) => (
                    <div key={team.id} className="border border-gray-200 dark:border-zinc-800 rounded-xl p-5 bg-gray-50 dark:bg-[#18181B]">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                                <div className="col-span-2 space-y-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Team Name / Short / Color</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={team.name} onChange={e => updateTeam(team.id, { name: e.target.value })} className="w-full rounded-md border px-3 py-1.5 text-sm dark:bg-[#18181B] dark:border-zinc-700 dark:text-white focus:border-[#C8FF00] focus:outline-none" placeholder="Name" />
                                        <input type="text" value={team.short} onChange={e => updateTeam(team.id, { short: e.target.value })} className="w-20 rounded-md border px-3 py-1.5 text-sm dark:bg-[#18181B] dark:border-zinc-700 dark:text-white uppercase focus:border-[#C8FF00] focus:outline-none" placeholder="Short" />
                                        <input type="color" value={team.color} onChange={e => updateTeam(team.id, { color: e.target.value })} className="w-12 h-[34px] rounded-md border p-1 bg-transparent dark:border-zinc-700 cursor-pointer" />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Rating (P/W/D/L/GD/PTS)</label>
                                    <div className="flex gap-2">
                                        <input type="number" value={team.played} onChange={e => updateTeam(team.id, { played: +e.target.value })} className="w-12 rounded-md border px-1 py-1.5 text-sm text-center dark:bg-[#18181B] dark:border-zinc-700 dark:text-white focus:border-[#C8FF00] focus:outline-none" title="Played" />
                                        <input type="number" value={team.w} onChange={e => updateTeam(team.id, { w: +e.target.value })} className="w-12 rounded-md border px-1 py-1.5 text-sm text-center dark:bg-[#18181B] dark:border-zinc-700 dark:text-white focus:border-[#C8FF00] focus:outline-none" title="Won" />
                                        <input type="number" value={team.d} onChange={e => updateTeam(team.id, { d: +e.target.value })} className="w-12 rounded-md border px-1 py-1.5 text-sm text-center dark:bg-[#18181B] dark:border-zinc-700 dark:text-white focus:border-[#C8FF00] focus:outline-none" title="Drawn" />
                                        <input type="number" value={team.l} onChange={e => updateTeam(team.id, { l: +e.target.value })} className="w-12 rounded-md border px-1 py-1.5 text-sm text-center dark:bg-[#18181B] dark:border-zinc-700 dark:text-white focus:border-[#C8FF00] focus:outline-none" title="Lost" />
                                        <input type="number" value={team.gd} onChange={e => updateTeam(team.id, { gd: +e.target.value })} className="w-14 rounded-md border px-1 py-1.5 text-sm text-center dark:bg-[#18181B] dark:border-zinc-700 dark:text-white focus:border-[#C8FF00] focus:outline-none" title="GD" />
                                        <input type="number" value={team.pts} onChange={e => updateTeam(team.id, { pts: +e.target.value })} className="w-14 rounded-md border px-1 py-1.5 font-bold text-sm text-center bg-gray-200 dark:bg-zinc-800 dark:border-zinc-700 dark:text-[#C8FF00] focus:border-[#C8FF00] focus:outline-none" title="Points" />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="block text-xs font-semibold text-gray-500 uppercase">Form (CSV) / Verdict</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={team.form.join(",")} onChange={e => updateTeam(team.id, { form: e.target.value.split(",") })} className="w-[100px] rounded-md border px-3 py-1.5 text-sm dark:bg-[#18181B] dark:border-zinc-700 dark:text-white uppercase tracking-widest focus:border-[#C8FF00] focus:outline-none" placeholder="W,D,L" />
                                        <input type="text" value={team.verdict} onChange={e => updateTeam(team.id, { verdict: e.target.value })} className="flex-1 rounded-md border px-3 py-1.5 text-sm dark:bg-[#18181B] dark:border-zinc-700 dark:text-white focus:border-[#C8FF00] focus:outline-none" placeholder="Verdict" />
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => removeTeam(team.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Remaining Fixtures</h4>
                                <button onClick={() => addFixture(team.id)} className="text-xs flex items-center gap-1 font-bold text-[#b5e600] hover:text-[#C8FF00]">
                                    <Plus className="w-3 h-3" /> Add Fixture
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {team.remaining.length === 0 && <span className="text-sm text-gray-500">No fixtures added.</span>}
                                {team.remaining.map((fixture, idx) => (
                                    <div key={idx} className="flex items-center gap-1 bg-white dark:bg-[#09090B] p-2 rounded-lg border border-gray-200 dark:border-zinc-800">
                                        <input type="text" value={fixture.opp} onChange={e => updateFixture(team.id, idx, { opp: e.target.value })} className="w-[70px] px-2 py-1 text-sm border border-gray-200 dark:border-zinc-700 rounded-md bg-transparent dark:text-white uppercase font-bold focus:border-[#C8FF00] focus:outline-none" placeholder="OPP" />
                                        <select value={fixture.h ? "1" : "0"} onChange={e => updateFixture(team.id, idx, { h: e.target.value === "1" })} className="px-1.5 py-1 text-sm border border-gray-200 dark:border-zinc-700 rounded-md bg-transparent dark:text-white focus:border-[#C8FF00] focus:outline-none">
                                            <option value="1">H</option><option value="0">A</option>
                                        </select>
                                        <select value={fixture.diff} onChange={e => updateFixture(team.id, idx, { diff: parseInt(e.target.value) as 1|2|3 })} className="px-1.5 py-1 text-sm border border-gray-200 dark:border-zinc-700 rounded-md bg-transparent dark:text-white focus:border-[#C8FF00] focus:outline-none">
                                            <option value={1}>Diff 1</option><option value={2}>Diff 2</option><option value={3}>Diff 3</option>
                                        </select>
                                        <button onClick={() => removeFixture(team.id, idx)} className="p-1.5 ml-1 text-gray-400 hover:text-red-500 rounded-md hover:bg-zinc-800 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

