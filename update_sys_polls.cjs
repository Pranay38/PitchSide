const fs = require('fs');

let content = fs.readFileSync('api/sys.ts', 'utf8');

// 1. Add the polls imports
content = content.replace(/import \{ getSettings, updateSettings \} from "\.\.\/server\/endpoints\/settings";/, (match) => {
    return match + '\nimport { getPolls, createPoll, updatePoll, deletePoll, votePoll } from "../server/endpoints/polls";';
});

// 2. Add the polls route cases
const pollCases = `
      // Polls
      case "polls":
        if (req.method === "GET") return await getPolls(req, res);
        if (req.method === "POST") return await createPoll(req, res);
        if (req.method === "PUT") return await updatePoll(req, res);
        if (req.method === "DELETE") return await deletePoll(req, res);
        break;
      case "polls-vote":
        if (req.method === "POST") return await votePoll(req, res);
        break;
`;

content = content.replace(/case "debates-argue":[\s\S]*?break;/, (match) => {
    return match + '\n' + pollCases;
});

fs.writeFileSync('api/sys.ts', content);
console.log("Updated sys.ts with polls routes");

// 3. Add rewrite rules to vercel.json
let vercelContent = fs.readFileSync('vercel.json', 'utf8');

const pollRewrites = `
    {
      "source": "/api/polls/:id/vote",
      "destination": "/api/sys?action=polls-vote&id=:id"
    },
    {
      "source": "/api/polls/:id",
      "destination": "/api/sys?action=polls&id=:id"
    },
    {
      "source": "/api/polls",
      "destination": "/api/sys?action=polls"
    },
`;

vercelContent = vercelContent.replace(/"rewrites": \[\n/, '"rewrites": [\n' + pollRewrites);

fs.writeFileSync('vercel.json', vercelContent);
console.log("Updated vercel.json with poll rewrites");

