const fs = require('fs');

let content = fs.readFileSync('src/app/pages/AdminPage.tsx', 'utf8');

// 1. Add 'polls' to Tab type
content = content.replace(/type Tab = "posts" \| "stories" \| "collections" \| "debates" \| "run-in" \| "transfer-watch" \| "on-this-day" \| "settings";/, (match) => {
    return 'type Tab = "posts" | "stories" | "collections" | "debates" | "run-in" | "transfer-watch" | "on-this-day" | "settings" | "polls";';
});

// 2. Add icon import
content = content.replace(/import \{ Plus, Edit3, /, 'import { Plus, Edit3, HelpCircle, ');

// 3. Add Poll tab button
const pollTabButton = `
                    <button
                        onClick={() => setActiveTab("polls")}
                        className={\`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors \${activeTab === "polls" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}\`}
                    >
                        <HelpCircle className="w-4 h-4" /> Polls (Server)
                    </button>
                    `;

content = content.replace(/<button\n\s*onClick=\{\(\) => setActiveTab\("debates"\)\}/, (match) => {
    return pollTabButton + match;
});

// 4. State for Polls
content = content.replace(/const \[expandedDebateId, setExpandedDebateId\] = useState<string \| null>\(null\);/, (match) => {
    return match + `
    const [serverPolls, setServerPolls] = useState<any[]>([]);
    const [editingPoll, setEditingPoll] = useState<any>(null);
    const [savingPoll, setSavingPoll] = useState(false);
`;
});

// 5. Fetch polls
content = content.replace(/const fetchDebates = useCallback\(async \(\) => \{[\s\S]*?\}, \[\]\);/, (match) => {
    return match + `
    const fetchServerPolls = useCallback(async () => {
        try {
            const pwd = import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem("pitchside_pwd");
            const res = await fetch("/api/polls", {
                headers: { Authorization: \`Bearer \${pwd}\` }
            });
            if (res.ok) setServerPolls(await res.json());
        } catch {}
    }, []);
`;
});

// 6. Effect hook
content = content.replace(/if \(activeTab === "debates"\) fetchDebates\(\);/, (match) => {
    return match + `\n        if (activeTab === "polls") fetchServerPolls();`;
});

// 7. Render Polls Tab Content
const pollsTabContent = `
                {/* POLLS TAB */}
                {activeTab === "polls" && (
                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold text-[#0F172A] dark:text-white">Admin-Managed Polls</h2>
                                <p className="text-sm text-[#64748B] dark:text-gray-400 mt-1">
                                    Create and manage voting polls stored in MongoDB.
                                </p>
                            </div>
                            <button
                                onClick={() => setEditingPoll({ question: "", options: [{id: "1", text: "", votes:0}, {id: "2", text: "", votes:0}], isActive: false })}
                                className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all"
                            >
                                <Plus className="w-4 h-4" /> Create Poll
                            </button>
                        </div>

                        {editingPoll && (
                            <div className="bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-bold">{editingPoll._id ? "Edit Poll" : "New Poll"}</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <span className="text-sm font-bold text-[#16A34A]">Set as Active (Live)</span>
                                        <input
                                           type="checkbox"
                                           checked={editingPoll.isActive}
                                           onChange={e => setEditingPoll({...editingPoll, isActive: e.target.checked})}
                                           className="w-4 h-4 accent-[#16A34A]"
                                        />
                                    </label>
                                </div>
                                <div className="space-y-4">
                                    <label className="block">
                                        <span className="block text-sm font-medium mb-1">Question</span>
                                        <input
                                           type="text"
                                           value={editingPoll.question}
                                           onChange={e => setEditingPoll({...editingPoll, question: e.target.value})}
                                           className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2.5"
                                           placeholder="Who will win the league?"
                                        />
                                    </label>
                                    
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-sm font-medium">Options</span>
                                            <button 
                                                onClick={() => setEditingPoll({...editingPoll, options: [...editingPoll.options, {id: Date.now().toString(), text:"", votes:0}]})}
                                                className="text-xs text-[#16A34A] font-bold"
                                            >+ Add Option</button>
                                        </div>
                                        <div className="space-y-2">
                                            {editingPoll.options.map((opt:any, i:number) => (
                                                <div key={i} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={opt.text}
                                                        onChange={e => {
                                                            const newOps = [...editingPoll.options];
                                                            newOps[i].text = e.target.value;
                                                            setEditingPoll({...editingPoll, options: newOps});
                                                        }}
                                                        className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#0F172A] px-4 py-2 text-sm"
                                                        placeholder={\`Option \${i+1}\`}
                                                    />
                                                    <span className="text-xs text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                        {opt.votes} votes
                                                    </span>
                                                    <button 
                                                        onClick={() => {
                                                            const newOps = [...editingPoll.options];
                                                            newOps.splice(i, 1);
                                                            setEditingPoll({...editingPoll, options: newOps});
                                                        }}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                    ><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-3 justify-end mt-6">
                                        <button onClick={() => setEditingPoll(null)} className="px-5 py-2.5 rounded-xl font-medium text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">Cancel</button>
                                        <button 
                                            disabled={savingPoll}
                                            onClick={async () => {
                                                setSavingPoll(true);
                                                try {
                                                    const pwd = import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem("pitchside_pwd");
                                                    const url = editingPoll._id ? \`/api/polls/\${editingPoll._id}\` : "/api/polls";
                                                    const method = editingPoll._id ? "PUT" : "POST";
                                                    
                                                    const res = await fetch(url, {
                                                        method,
                                                        headers: { "Content-Type": "application/json", Authorization: \`Bearer \${pwd}\` },
                                                        body: JSON.stringify(editingPoll)
                                                    });
                                                    
                                                    if (res.ok) {
                                                        toast.success("Poll saved!");
                                                        setEditingPoll(null);
                                                        fetchServerPolls();
                                                    } else {
                                                        toast.error("Failed to save poll");
                                                    }
                                                } finally {
                                                    setSavingPoll(false);
                                                }
                                            }}
                                            className="px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d]"
                                        >
                                            {savingPoll ? "Saving..." : "Save Poll"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!editingPoll && (
                             <div className="space-y-4">
                                {serverPolls.map(poll => (
                                    <div key={poll._id} className={\`bg-white dark:bg-[#1E293B] rounded-2xl border \${poll.isActive ? 'border-[#16A34A] shadow-[#16A34A]/10' : 'border-gray-100 dark:border-gray-800'} p-5 shadow-sm flex items-center justify-between\`}>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                {poll.isActive && <span className="px-2 py-0.5 text-[10px] uppercase font-black bg-[#16A34A] text-white rounded-md">Active Live</span>}
                                                <h3 className="font-bold text-lg">{poll.question}</h3>
                                            </div>
                                            <p className="text-xs text-gray-500">
                                                {poll.options.length} options • {poll.options.reduce((sum:number, o:any) => sum + (o.votes||0), 0)} total votes • Created {new Date(poll.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setEditingPoll(poll)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                                                <Edit3 className="w-5 h-5"/>
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    if(!window.confirm("Delete this poll?")) return;
                                                    const pwd = import.meta.env.VITE_ADMIN_PASSWORD || localStorage.getItem("pitchside_pwd");
                                                    await fetch(\`/api/polls/\${poll._id}\`, { method: "DELETE", headers: {Authorization: \`Bearer \${pwd}\`} });
                                                    fetchServerPolls();
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            >
                                                <Trash2 className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {serverPolls.length === 0 && (
                                    <div className="py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
                                        <HelpCircle className="w-8 h-8 mx-auto text-gray-300 mb-2"/>
                                        <p className="text-gray-500 font-medium">No polls found in database.</p>
                                    </div>
                                )}
                             </div>
                        )}
                     </div>
                )}
`;

content = content.replace(/\{\/\* DEBATES TAB \*\/\}/, pollsTabContent + '\n                {/* DEBATES TAB */}');


fs.writeFileSync('src/app/pages/AdminPage.tsx', content);
console.log("Updated AdminPage.tsx with Polls tab");
