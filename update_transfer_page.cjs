const fs = require('fs');

let content = fs.readFileSync('src/app/pages/TransferReliabilityPage.tsx', 'utf8');

// 1. Add BadgeCheck to lucide-react imports
content = content.replace(/import \{.*?\} from "lucide-react";/s, (match) => {
  return match.replace('ShieldCheck,', 'ShieldCheck, BadgeCheck, Clock,');
});

// 2. Add Source Badge Logic right before the component return
const badgeLogic = `
  // Determine if there's a Tier 1 source mentioned in the rationale
  const getSourceBadge = (rationale: string[]) => {
    const text = rationale.join(" ").toLowerCase();
    if (text.includes("fabrizio romano") || text.includes("david ornstein") || text.includes("tier 1")) {
      return { label: "Tier 1 Source", color: "bg-amber-500/10 text-amber-500 border border-amber-500/20" };
    }
    if (text.includes("tier 2") || text.includes("sky sports") || text.includes("bbc")) {
      return { label: "Tier 2 Source", color: "bg-blue-500/10 text-blue-500 border border-blue-500/20" };
    }
    return null;
  };
`;

content = content.replace(/return \(\n\s*<div className="min-h-screen bg-white dark:bg-\[#0a0e1a\]">/, badgeLogic + '\n  return (\n    <div className="min-h-screen bg-white dark:bg-[#0a0e1a]">');

// 3. Inject the Badge in the header area
content = content.replace(/<span className=\{`px-3 py-1 rounded-full text-\[11px\] font-black uppercase tracking-\[0\.18em\] \$\{entry\.reliabilityScore >= 75 \? "bg-emerald-500\/10 text-emerald-600 dark:text-emerald-300" : "bg-slate-500\/10 text-slate-600 dark:text-slate-300"\}`\}>\s*\{entry\.reliabilityLabel\}\s*<\/span>\n\s*<\/div>/, (match) => {
    return `${match}
                    {(() => {
                        const badge = getSourceBadge(entry.rationale);
                        if (!badge) return null;
                        return (
                          <div className="mt-3 flex items-center gap-1.5 w-max px-2.5 py-1 rounded-md bg-opacity-10 font-bold text-[10px] uppercase tracking-wider \${badge.color}">
                            <BadgeCheck className="w-3.5 h-3.5" />
                            {badge.label}
                          </div>
                        );
                    })()}
                    `;
});

// 4. Transform the Rationale array into a visual Timeline
content = content.replace(/<div className="space-y-2">\s*\{entry\.rationale\.map\(\(line\) => \(\s*<p key=\{line\} className="text-sm text-\[#475569\] dark:text-gray-300">\{line\}<\/p>\s*\)\)\}\s*<\/div>/s, (match) => {
    return `<div className="relative pl-4 space-y-4 before:absolute before:inset-y-2 before:left-[7px] before:w-[2px] before:bg-gray-200 dark:before:bg-gray-800">
                      {entry.rationale.map((line, index) => (
                        <div key={line} className="relative">
                          <div className="absolute -left-[19px] top-1.5 w-2 h-2 rounded-full bg-[#16A34A] border-2 border-white dark:border-[#111827]" />
                          <div className="bg-white dark:bg-[#0F172A] p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                             <div className="flex items-center gap-2 mb-1">
                               <Clock className="w-3 h-3 text-gray-400" />
                               <span className="text-[10px] font-bold text-gray-400 uppercase">Update {entry.rationale.length - index}</span>
                             </div>
                             <p className="text-sm text-[#475569] dark:text-gray-300 leading-relaxed">{line}</p>
                          </div>
                        </div>
                      ))}
                    </div>`;
});

// Fix the literal string interpolation syntax that was accidentally left as \${badge.color}
content = content.replace(/className="mt-3 flex items-center gap-1\.5 w-max px-2\.5 py-1 rounded-md bg-opacity-10 font-bold text-\[10px\] uppercase tracking-wider \\\$\{badge\.color\}"/, 'className={`mt-3 flex items-center gap-1.5 w-max px-2.5 py-1 rounded-md font-bold text-[10px] uppercase tracking-wider ${badge.color}`}');



fs.writeFileSync('src/app/pages/TransferReliabilityPage.tsx', content);
console.log("Updated TransferReliabilityPage.tsx");
