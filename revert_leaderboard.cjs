const fs = require('fs');

let rContent = fs.readFileSync('src/app/routes.tsx', 'utf8');
rContent = rContent.replace(/import \{ LeaderboardPage \} from "\.\/pages\/LeaderboardPage";\n/, "");
rContent = rContent.replace(/\s*\{\s*path: "leaderboard",\s*Component: LeaderboardPage,\s*\},/, "");
fs.writeFileSync('src/app/routes.tsx', rContent);
console.log("Reverted routes.tsx");

let hContent = fs.readFileSync('src/app/components/Header.tsx', 'utf8');
hContent = hContent.replace(/\s*\{ label: "Leaderboard", href: "\/leaderboard" \},/, "");
fs.writeFileSync('src/app/components/Header.tsx', hContent);
console.log("Reverted Header.tsx");

let fContent = fs.readFileSync('src/app/components/Footer.tsx', 'utf8');
fContent = fContent.replace(/\n\s*<li><Link to="\/leaderboard" className="text-gray-400 hover:text-white transition-colors">Predictions Leaderboard<\/Link><\/li>/, "");
fs.writeFileSync('src/app/components/Footer.tsx', fContent);
console.log("Reverted Footer.tsx");

