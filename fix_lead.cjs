const fs = require('fs');

let content = fs.readFileSync('src/app/pages/LeaderboardPage.tsx', 'utf8');

// The issue was escaping backticks in the JS template literal that wrote the React code
content = content.replace(/className=\{\\\`flex items-center gap-4 p-4 sm:p-6 transition-colors \\\$\{\n\s*isYou \? "bg-\[#16A34A\]\/5 border-l-4 border-l-\[#16A34A\] dark:bg-\[#16A34A\]\/10" : "hover:bg-gray-50 dark:hover:bg-white\/\[0\.02\] border-l-4 border-l-transparent"\n\s*\}\\\`\}/, (match) => {
    return `className={\`flex items-center gap-4 p-4 sm:p-6 transition-colors \${
                            isYou ? "bg-[#16A34A]/5 border-l-4 border-l-[#16A34A] dark:bg-[#16A34A]/10" : "hover:bg-gray-50 dark:hover:bg-white/[0.02] border-l-4 border-l-transparent"
                        }\`}`;
});

content = content.replace(/className=\{\\\`text-base sm:text-lg font-bold truncate \\\$\{\s*isYou \? "text-\[#16A34A\] dark:text-\[#4ade80\]" : "text-\[#0F172A\] dark:text-white"\s*\}\\\`\}/, (match) => {
    return `className={\`text-base sm:text-lg font-bold truncate \${isYou ? "text-[#16A34A] dark:text-[#4ade80]" : "text-[#0F172A] dark:text-white"}\`}`;
});


fs.writeFileSync('src/app/pages/LeaderboardPage.tsx', content);
console.log("Fixed backticks in LeaderboardPage.tsx");
