const fs = require('fs');

let content = fs.readFileSync('src/app/pages/DebateCornerPage.tsx', 'utf8');

// 1. Add imports: PieChart, Pie, Cell from recharts, and Share2 from lucide-react
content = content.replace(/import \{.*?\} from "lucide-react";/s, (match) => {
  return match.replace('MessageSquare,', 'MessageSquare, Share2, Clock,') + '\nimport { PieChart, Pie, Cell } from "recharts";';
});

// 2. Replace VoteBar component with a new Pie Chart visualization
const newVoteBar = `
function VoteBar({ agree, disagree }: { agree: number; disagree: number }) {
    const total = agree + disagree || 1;
    const agreePct = Math.round((agree / total) * 100);
    const disagreePct = 100 - agreePct;
    
    const data = [
        { name: "Agree", value: agree || 1 }, // ensure at least 1 pixel shows if 0-0 so chart doesn't break, though we hide if 0-0
        { name: "Disagree", value: disagree || 1 }
    ];
    
    const COLORS = ['#10B981', '#EF4444']; // emerald-500, red-500
    
    if (agree === 0 && disagree === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-4 bg-white/5 rounded-xl border border-white/5">
                <p className="text-gray-500 text-xs font-medium">No votes cast yet</p>
                <p className="text-gray-600 text-[10px] mt-0.5">Be the first to shape this debate</p>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-6 bg-white/[0.02] p-4 rounded-xl border border-white/5">
            <div className="w-[100px] h-[100px] flex-shrink-0 relative">
                <PieChart width={100} height={100}>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={32}
                        outerRadius={46}
                        stroke="rgba(255,255,255,0.05)"
                        strokeWidth={2}
                        paddingAngle={2}
                        dataKey="value"
                        isAnimationActive={true}
                    >
                        {data.map((entry, index) => (
                            <Cell key={\`cell-\${index}\`} fill={agree === 0 && disagree === 0 ? '#334155' : COLORS[index]} />
                        ))}
                    </Pie>
                </PieChart>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                    <span className="text-[10px] text-gray-400 font-semibold leading-none">Total</span>
                    <span className="text-sm font-black text-white leading-none mt-1">{total}</span>
                </div>
            </div>
            
            <div className="flex-1 space-y-3">
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-bold text-emerald-400">Agree</span>
                        <span className="text-sm border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-black">{agreePct}%</span>
                    </div>
                    <p className="text-[10px] text-emerald-500/70 font-medium">{agree} votes</p>
                </div>
                <div>
                    <div className="flex justify-between items-end mb-1">
                        <span className="text-xs font-bold text-red-400">Disagree</span>
                        <span className="text-sm border border-red-500/20 bg-red-500/10 text-red-400 px-2 py-0.5 rounded-md font-black">{disagreePct}%</span>
                    </div>
                    <p className="text-[10px] text-red-500/70 font-medium">{disagree} votes</p>
                </div>
            </div>
        </div>
    );
}`;

content = content.replace(/function VoteBar.*?return \([\s\S]*?\);\n\}/, newVoteBar);

// 3. Add Twitter sharing function to the component
content = content.replace(/const handleLike =.*?catch \(e\) \{ console\.error\(e\); \}\n    \};/s, (match) => {
    return match + `\n\n    const handleShareTwitter = (debate: Debate) => {
        const url = encodeURIComponent(window.location.origin + "/debates");
        const text = encodeURIComponent(\`🔥 \${debate.title}\\n\\nWhere do you stand? Agree or Disagree? Vote now on Pitchside!\`);
        window.open(\`https://twitter.com/intent/tweet?url=\${url}&text=\${text}\`, "_blank");
    };`;
});

// 4. Time limit logic: calculate isClosed inside the map
content = content.replace(/const isExpanded = expandedId === debate\.id;\n.*?\const hasVoted = votedIds\.has\(debate\.id\);/, (match) => {
    return `const isExpanded = expandedId === debate.id;
                            const hasVoted = votedIds.has(debate.id);
                            
                            // Debate closes after 7 days
                            const createdAtTime = new Date(debate.createdAt).getTime();
                            const isClosed = !debate.active || (Date.now() - createdAtTime > 7 * 24 * 60 * 60 * 1000);
                            const daysLeft = Math.max(0, 7 - Math.floor((Date.now() - createdAtTime) / (24 * 60 * 60 * 1000)));`;
});

// 5. Update the Debate Header with Twitter Share button and Time Limit Badge
content = content.replace(/<div className="flex-1">\s*<span className="text-\[10px\] uppercase tracking-widest text-gray-600 font-semibold">\{debate\.category\}<\/span>\s*<h3 className="text-base sm:text-lg font-bold text-white mt-0\.5">\{debate\.title\}<\/h3>\s*\{debate\.description && <p className="text-sm text-gray-500 mt-1">\{debate\.description\}<\/p>\}\s*<\/div>/, (match) => {
    return `<div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <span className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">{debate.category}</span>
                                                        <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 pr-2">{debate.title}</h3>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                                        <button 
                                                            onClick={() => handleShareTwitter(debate)}
                                                            className="text-gray-500 hover:text-[#1DA1F2] transition bg-white/5 p-1.5 rounded-lg"
                                                            title="Share to Twitter"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        {isClosed ? (
                                                            <span className="text-[9px] font-black uppercase tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">Closed</span>
                                                        ) : (
                                                            <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                                                                <Clock className="w-2.5 h-2.5" /> {daysLeft} days left
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {debate.description && <p className="text-sm text-gray-500 mt-2">{debate.description}</p>}
                                            </div>`;
});


// 6. Disable vote buttons if closed
content = content.replace(/disabled=\{hasVoted\}/g, 'disabled={hasVoted || isClosed}');
content = content.replace(/\{hasVoted \? "Voted Agree" : "I Agree"\}/, '{isClosed ? "Voting Closed" : hasVoted ? "Voted Agree" : "I Agree"}');
content = content.replace(/\{hasVoted \? "Voted Disagree" : "I Disagree"\}/, '{isClosed ? "Voting Closed" : hasVoted ? "Voted Disagree" : "I Disagree"}');

// 7. Hide "Submit argument" section if closed
content = content.replace(/\{\/\* Submit argument \*\/\}\s*<div className="p-4 border-b border-white\/5">[\s\S]*?\{\/\* Arguments list \*\/\}/, (match) => {
    return `{!isClosed ? (
                                                <>
                                                    {/* Submit argument */}
                                                    <div className="p-4 border-b border-white/5 bg-black/20">
                                                        <div className="flex gap-2 mb-3">
                                                            <button
                                                                onClick={() => setArgSide("agree")}
                                                                className={\`px-3 py-1 text-[11px] rounded-full font-semibold transition \${argSide === "agree" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/5 text-gray-500 border border-transparent hover:bg-white/10"
                                                                    }\`}
                                                            >
                                                                👍 For
                                                            </button>
                                                            <button
                                                                onClick={() => setArgSide("disagree")}
                                                                className={\`px-3 py-1 text-[11px] rounded-full font-semibold transition \${argSide === "disagree" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-white/5 text-gray-500 border border-transparent hover:bg-white/10"
                                                                    }\`}
                                                            >
                                                                👎 Against
                                                            </button>
                                                            <input
                                                                type="text"
                                                                value={argAuthor}
                                                                onChange={(e) => setArgAuthor(e.target.value)}
                                                                placeholder="Your name (optional)"
                                                                className="flex-1 bg-transparent text-[11px] text-gray-400 border-b border-white/10 focus:border-emerald-500/30 focus:outline-none px-2 py-1 ml-2"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={argText}
                                                                onChange={(e) => setArgText(e.target.value)}
                                                                onKeyDown={(e) => e.key === "Enter" && handleSubmitArg(debate.id)}
                                                                placeholder="Make your argument..."
                                                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/10 transition-all"
                                                                maxLength={500}
                                                            />
                                                            <button
                                                                onClick={() => handleSubmitArg(debate.id)}
                                                                disabled={submitting || !argText.trim()}
                                                                className="px-5 py-3 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all disabled:opacity-40 disabled:shadow-none"
                                                            >
                                                                <Send className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="p-4 border-b border-white/5 bg-red-500/5 text-center">
                                                    <p className="text-xs text-red-400/80 font-medium">Voting and arguments are closed for this debate.</p>
                                                </div>
                                            )}

                                            {/* Arguments list */}`;
});


fs.writeFileSync('src/app/pages/DebateCornerPage.tsx', content);
console.log("Updated DebateCornerPage.tsx");
