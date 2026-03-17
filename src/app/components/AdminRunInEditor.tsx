import { useState, useEffect } from "react";
import { Plus, Trash2, Save, MoveUp, MoveDown, Info } from "lucide-react";
import { toast } from "sonner";

const ADMIN_KEY = "pitchside_admin_auth";

interface Fixture {
    id: string;
    opponent: string;
    isHome: boolean;
    difficulty: 1 | 2 | 3 | 4 | 5;
}

interface RunInTeamData {
    id: string;
    teamName: string;
    logoHash: string;
    currentPoints: number;
    goalDifference: number;
    fixtures: Fixture[];
    rank: number;
}

export function AdminRunInEditor() {
    const [title, setTitle] = useState("Premier League Title Race");
    const [description, setDescription] = useState("");
    const [teams, setTeams] = useState<RunInTeamData[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/run-in");
                if (res.ok) {
                    const data = await res.json();
                    setTitle(data.title || "Premier League Title Race");
                    setDescription(data.description || "");
                    setTeams(data.teams || []);
                }
            } catch (err) {
                toast.error("Failed to load Run-In Configuration");
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/run-in", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem(ADMIN_KEY) || ""}`,
                },
                body: JSON.stringify({ title, description, teams }),
            });
            if (res.ok) {
                toast.success("Run-In Tracker updated successfully!");
            } else {
                toast.error("Failed to update Run-In Tracker.");
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
                teamName: "New Team",
                logoHash: "",
                currentPoints: 0,
                goalDifference: 0,
                rank: teams.length + 1,
                fixtures: [],
            },
        ]);
    };

    const removeTeam = (teamId: string) => {
        if (!confirm("Remove this team?")) return;
        setTeams(teams.filter(t => t.id !== teamId));
    };

    const updateTeam = (teamId: string, updates: Partial<RunInTeamData>) => {
        setTeams(teams.map(t => t.id === teamId ? { ...t, ...updates } : t));
    };

    const addFixture = (teamId: string) => {
        updateTeam(teamId, {
            fixtures: [
                ...teams.find(t => t.id === teamId)!.fixtures,
                { id: `fix_${Date.now()}`, opponent: "OPP", isHome: true, difficulty: 3 }
            ]
        });
    };

    const removeFixture = (teamId: string, fixtureId: string) => {
        updateTeam(teamId, {
            fixtures: teams.find(t => t.id === teamId)!.fixtures.filter(f => f.id !== fixtureId)
        });
    };

    const updateFixture = (teamId: string, fixtureId: string, updates: Partial<Fixture>) => {
        const team = teams.find(t => t.id === teamId)!;
        updateTeam(teamId, {
            fixtures: team.fixtures.map(f => f.id === fixtureId ? { ...f, ...updates } : f)
        });
    };

    const moveFixture = (teamId: string, index: number, direction: 'up' | 'down') => {
        const team = teams.find(t => t.id === teamId)!;
        const newFixtures = [...team.fixtures];
        if (direction === 'up' && index > 0) {
            [newFixtures[index], newFixtures[index - 1]] = [newFixtures[index - 1], newFixtures[index]];
        } else if (direction === 'down' && index < newFixtures.length - 1) {
            [newFixtures[index], newFixtures[index + 1]] = [newFixtures[index + 1], newFixtures[index]];
        }
        updateTeam(teamId, { fixtures: newFixtures });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Run-In configuration...</div>;

    return (
        <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-[#0F172A] dark:text-white">Run-In Tracker Configuration</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage the teams, points, and remaining fixtures for the live tracker component.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all disabled:opacity-50"
                >
                    <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
                </button>
            </div>

            <div className="space-y-4 mb-8">
                <div>
                    <label className="block text-sm font-medium text-[#0F172A] dark:text-gray-300 mb-1">Widget Title</label>
                    <input
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] px-4 py-2 text-sm text-[#0F172A] dark:text-white focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
                        placeholder="e.g. Premier League Title Race"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[#0F172A] dark:text-gray-300 mb-1">Description (Optional)</label>
                    <input
                        type="text"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#0F172A] px-4 py-2 text-sm text-[#0F172A] dark:text-white focus:ring-2 focus:ring-[#16A34A] focus:outline-none"
                        placeholder="e.g. The final 10 games of the season."
                    />
                </div>
            </div>

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-white">Teams</h3>
                <button
                    onClick={addTeam}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40"
                >
                    <Plus className="w-4 h-4" /> Add Team
                </button>
            </div>

            <div className="space-y-6">
                {teams.length === 0 && (
                    <div className="p-8 text-center text-gray-500 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl">
                        No teams added yet.
                    </div>
                )}
                
                {teams.map((team) => (
                    <div key={team.id} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-gray-50 dark:bg-[#0F172A]">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Team Name</label>
                                    <input
                                        type="text"
                                        value={team.teamName}
                                        onChange={e => updateTeam(team.id, { teamName: e.target.value })}
                                        className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1E293B] px-3 py-1.5 text-sm dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Rank</label>
                                    <input
                                        type="number"
                                        value={team.rank}
                                        onChange={e => updateTeam(team.id, { rank: parseInt(e.target.value) || 0 })}
                                        className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1E293B] px-3 py-1.5 text-sm dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Points</label>
                                    <input
                                        type="number"
                                        value={team.currentPoints}
                                        onChange={e => updateTeam(team.id, { currentPoints: parseInt(e.target.value) || 0 })}
                                        className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1E293B] px-3 py-1.5 text-sm dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Goal Diff</label>
                                    <input
                                        type="number"
                                        value={team.goalDifference}
                                        onChange={e => updateTeam(team.id, { goalDifference: parseInt(e.target.value) || 0 })}
                                        className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-[#1E293B] px-3 py-1.5 text-sm dark:text-white"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => removeTeam(team.id)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Remaining Fixtures</h4>
                                <button
                                    onClick={() => addFixture(team.id)}
                                    className="text-xs flex items-center gap-1 font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
                                >
                                    <Plus className="w-3 h-3" /> Add Fixture
                                </button>
                            </div>
                            
                            <div className="space-y-2">
                                {team.fixtures.length === 0 && <span className="text-xs text-gray-500">No fixtures added.</span>}
                                {team.fixtures.map((fixture, index) => (
                                    <div key={fixture.id} className="flex gap-2 items-center bg-white dark:bg-[#1E293B] p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <div className="flex flex-col gap-1 px-1">
                                            <button onClick={() => moveFixture(team.id, index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><MoveUp className="w-3 h-3" /></button>
                                            <button onClick={() => moveFixture(team.id, index, 'down')} disabled={index === team.fixtures.length - 1} className="text-gray-400 hover:text-gray-700 disabled:opacity-30"><MoveDown className="w-3 h-3" /></button>
                                        </div>
                                        <input
                                            type="text"
                                            value={fixture.opponent}
                                            onChange={e => updateFixture(team.id, fixture.id, { opponent: e.target.value })}
                                            placeholder="Opponent (e.g. LIV)"
                                            className="w-24 px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-transparent dark:text-white uppercase"
                                        />
                                        <select
                                            value={fixture.isHome ? "true" : "false"}
                                            onChange={e => updateFixture(team.id, fixture.id, { isHome: e.target.value === "true" })}
                                            className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded bg-transparent dark:text-white"
                                        >
                                            <option value="true">(H)</option>
                                            <option value="false">(A)</option>
                                        </select>
                                        <select
                                            value={fixture.difficulty}
                                            onChange={e => updateFixture(team.id, fixture.id, { difficulty: parseInt(e.target.value) as any })}
                                            className={`flex-1 px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded font-medium ${
                                                fixture.difficulty === 1 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                fixture.difficulty === 2 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                                                fixture.difficulty === 3 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                fixture.difficulty === 4 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                            }`}
                                        >
                                            <option value={1}>1 - Very Easy</option>
                                            <option value={2}>2 - Easiest</option>
                                            <option value={3}>3 - Moderate</option>
                                            <option value={4}>4 - Hard</option>
                                            <option value={5}>5 - Very Hard</option>
                                        </select>
                                        <button onClick={() => removeFixture(team.id, fixture.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
