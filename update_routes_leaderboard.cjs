const fs = require('fs');

let content = fs.readFileSync('src/app/routes.tsx', 'utf8');

// 1. Add import
content = content.replace(/import \{ TransferReliabilityPage \} from "\.\/pages\/TransferReliabilityPage";/, (match) => {
    return match + '\nimport { LeaderboardPage } from "./pages/LeaderboardPage";';
});

// 2. Add route under daily-fix
content = content.replace(/\{\s*path: "daily-fix",\s*Component: DailyFixPage,\s*\},/, (match) => {
    return match + '\n      {\n        path: "leaderboard",\n        Component: LeaderboardPage,\n      },';
});

fs.writeFileSync('src/app/routes.tsx', content);
console.log("Updated routes.tsx with LeaderboardPage");
