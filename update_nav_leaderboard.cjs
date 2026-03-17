const fs = require('fs');

let content = fs.readFileSync('src/app/components/Header.tsx', 'utf8');

// The main nav map
content = content.replace(/\{ label: "The Daily Fix", href: "\/daily-fix" \},/, (match) => {
    return match + '\n  { label: "Leaderboard", href: "/leaderboard" },';
});

fs.writeFileSync('src/app/components/Header.tsx', content);
console.log("Updated Header.tsx with Leaderboard link");

let footerContent = fs.readFileSync('src/app/components/Footer.tsx', 'utf8');

footerContent = footerContent.replace(/<li><Link to="\/debates".*?<\/Link><\/li>/, (match) => {
    return match + '\n                <li><Link to="/leaderboard" className="text-gray-400 hover:text-white transition-colors">Predictions Leaderboard</Link></li>';
});

fs.writeFileSync('src/app/components/Footer.tsx', footerContent);
console.log("Updated Footer.tsx with Leaderboard link");
