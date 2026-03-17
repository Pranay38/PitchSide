const fs = require('fs');

let content = fs.readFileSync('src/app/pages/StoryPage.tsx', 'utf8');

// Fix the import
content = content.replace(/getPublishedStories,/, 'getAllStories,');

// Fix the function call
content = content.replace(/getPublishedStories\(\)/, 'getAllStories()');

fs.writeFileSync('src/app/pages/StoryPage.tsx', content);
console.log("Fixed import in StoryPage.tsx");
