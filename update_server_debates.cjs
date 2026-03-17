const fs = require('fs');

let content = fs.readFileSync('server/endpoints/debates.ts', 'utf8');

// The cutoff logic
const cutoffLogic = `
                const debate = await collection.findOne(filter);
                if (!debate) return res.status(404).json({ error: "Debate not found" });
                const isClosed = !debate.active || (Date.now() - new Date(debate.createdAt).getTime() > 7 * 24 * 60 * 60 * 1000);
                if (isClosed) return res.status(403).json({ error: "Debate is closed" });
`;

// Add to vote
content = content.replace(/const field = side === "agree" \? "agreeVotes" : "disagreeVotes";/, (match) => {
    return cutoffLogic + '\n' + match;
});

// Add to argue
content = content.replace(/const argument = \{/, (match) => {
    return cutoffLogic + '\n                ' + match;
});

// Add to like
content = content.replace(/await collection\.updateOne\(\n\s*\{\s*\.\.\.filter, "arguments\.id": argumentId \},/, (match) => {
    return cutoffLogic + '\n                ' + match;
});


fs.writeFileSync('server/endpoints/debates.ts', content);
console.log("Updated debates.ts");
