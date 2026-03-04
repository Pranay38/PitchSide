import fs from 'fs';

let content = fs.readFileSync('src/app/pages/AdminPage.tsx', 'utf8');

// 1. Imports
content = content.replace(
    'import { Plus, Edit3, Trash2, LogOut, Eye, ExternalLink, Download, Upload, Mail, Send, RadioTower } from "lucide-react";',
    'import { Plus, Edit3, Trash2, LogOut, Eye, ExternalLink, Download, Upload, Mail, Send, RadioTower, Library, Flame, Layout, MessageSquare } from "lucide-react";'
);

// 2. States
const stateDecls = `
    const [activeTab, setActiveTab] = useState<"posts" | "collections" | "debates" | "settings">("posts");
    const [collections, setCollections] = useState<any[]>([]);
    const [debates, setDebates] = useState<any[]>([]);
    const [sendingDigest, setSendingDigest] = useState(false);
`;
content = content.replace(
    'const [savingSiteSettings, setSavingSiteSettings] = useState(false);',
    'const [savingSiteSettings, setSavingSiteSettings] = useState(false);' + stateDecls
);

// 3. fetchCollections, fetchDebates
const fetchMethods = `
    const fetchCollections = useCallback(async () => {
        try {
            const res = await fetch("/api/collections");
            if (res.ok) setCollections(await res.json());
        } catch {}
    }, []);

    const fetchDebates = useCallback(async () => {
        try {
            const res = await fetch("/api/debates");
            if (res.ok) setDebates(await res.json());
        } catch {}
    }, []);
`;
content = content.replace(
    'const refreshPosts = useCallback(async () => {',
    fetchMethods + '\n    const refreshPosts = useCallback(async () => {'
);

// 4. useEffect integration
content = content.replace(
    'getSiteSettingsAsync()',
    'fetchCollections();\n            fetchDebates();\n            getSiteSettingsAsync()'
).replace(
    '[isAuthed, refreshPosts, fetchSubscriberCount]',
    '[isAuthed, refreshPosts, fetchSubscriberCount, fetchCollections, fetchDebates]'
);

// 5. Handlers
const handlers = `
    const handleCreateCollection = async () => {
        const title = window.prompt("Collection Title:");
        if (!title) return;
        const description = window.prompt("Description:");
        const emoji = window.prompt("Emoji (e.g. 📚):", "📚");
        try {
            const res = await fetch("/api/collections", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, description, emoji })
            });
            if (res.ok) {
                toast.success("Collection created!");
                fetchCollections();
            } else {
                toast.error("Failed to create collection");
            }
        } catch {}
    };

    const handleDeleteCollection = async (id: string) => {
        if (!window.confirm("Delete this collection?")) return;
        try {
            await fetch(\`/api/collections?id=\${id}\`, { method: "DELETE" });
            toast.success("Collection deleted");
            fetchCollections();
        } catch {}
    };

    const handleCreateDebate = async () => {
        const title = window.prompt("Debate Title (e.g. Is Salah the best PL player ever?):");
        if (!title) return;
        const description = window.prompt("Description:");
        const category = window.prompt("Category (e.g. PL, Tactics):", "General");
        try {
            const res = await fetch("/api/debates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "create", title, description, category })
            });
            if (res.ok) {
                toast.success("Debate created!");
                fetchDebates();
            } else {
                toast.error("Failed to create debate");
            }
        } catch {}
    };

    const handleDeleteDebate = async (id: string) => {
        if (!window.confirm("Delete this debate?")) return;
        try {
            await fetch(\`/api/debates?id=\${id}\`, { method: "DELETE" });
            toast.success("Debate deleted");
            fetchDebates();
        } catch {}
    };

    const handleSendDigest = async () => {
        if (!window.confirm("Send weekly digest to all subscribers now?")) return;
        setSendingDigest(true);
        try {
            const res = await fetch("/api/digest", { method: "POST" });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "Digest sent!");
            } else {
                toast.error(data.error || "Failed to send digest");
            }
        } catch {
            toast.error("Error sending digest");
        }
        setSendingDigest(false);
    };
`;
content = content.replace(
    'const handleEditPost = (post: BlogPost) => {',
    handlers + '\n    const handleEditPost = (post: BlogPost) => {'
);

// 6. Tabs
const tabsUI = `
                {/* Tabs */}
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 mb-8 pb-4">
                    <button
                        onClick={() => setActiveTab("posts")}
                        className={\`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors \${
                            activeTab === "posts" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }\`}
                    >
                        <Layout className="w-4 h-4" /> Posts
                    </button>
                    <button
                        onClick={() => setActiveTab("collections")}
                        className={\`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors \${
                            activeTab === "collections" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }\`}
                    >
                        <Library className="w-4 h-4" /> Collections
                    </button>
                    <button
                        onClick={() => setActiveTab("debates")}
                        className={\`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors \${
                            activeTab === "debates" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }\`}
                    >
                        <Flame className="w-4 h-4" /> Debates
                    </button>
                    <button
                        onClick={() => setActiveTab("settings")}
                        className={\`px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-colors \${
                            activeTab === "settings" ? "bg-[#16A34A] text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }\`}
                    >
                        <RadioTower className="w-4 h-4" /> Site Settings & Newsletter
                    </button>
                </div>
`;
content = content.replace(
    '                {/* Dashboard Header */}',
    tabsUI + '\n                {/* Dashboard Header */}'
);

// 7. Conditional rendering for tabs
content = content.replace(
    '{/* Dashboard Header */}',
    '{activeTab === "posts" && (\n                    <>'
).replace(
    '                        ))}                </div>            )}        </main>    );}',
    `                        ))}
                    </div>
                )}
                </>
                )}

                {/* Settings Tab Contains Social Wall and Newsletter */}
                {activeTab === "settings" && (
                    <>
                        <section className="mb-8 bg-white dark:bg-[#1E293B] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
                            <h2 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2 mb-4">
                                <Mail className="w-5 h-5 text-[#16A34A]" />
                                Newsletter & Digest
                            </h2>
                            <p className="text-sm text-[#64748B] dark:text-gray-400 mb-6">
                                You have {subscriberCount} subscribers. The weekly digest is automatically sent every Sunday via Vercel Cron. You can also trigger it manually.
                            </p>
                            <button
                                onClick={handleSendDigest}
                                disabled={sendingDigest}
                                className="px-5 py-2.5 bg-[#16A34A] text-white rounded-xl font-medium text-sm hover:bg-[#15803d] transition-all disabled:opacity-50"
                            >
                                {sendingDigest ? 'Sending Digest...' : 'Send Weekly Digest Now'}
                            </button>
                        </section>
                `
);

content = content.replace(
    '{/* Social Wall Settings */}',
    `{/* Social Wall Settings */}` // Already wrapped in settings tab implicitly if I move it? Wait... The original social wall is before Posts List
);

// Actually, this manual replacing is prone to syntax errors. Let's do it cleanly by writing a completely specific wrapper.

// I will overwrite the file.
fs.writeFileSync('src/app/pages/AdminPage.tsx', content);
