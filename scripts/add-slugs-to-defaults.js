const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/data/posts.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Use a regex to find id and title and insert slug right after title
let idMatch;
const idRegex = /id:\s*"([^"]+)",\s*title:\s*"([^"]+)",/g;

let replacements = [];
while ((idMatch = idRegex.exec(content)) !== null) {
  const id = idMatch[1];
  const title = idMatch[2];
  
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  const slug = `${baseSlug}-${id.slice(-5).padStart(5, '0')}`;
  
  replacements.push({
    index: idMatch.index + idMatch[0].length,
    text: `\n    slug: "${slug}",`
  });
}

// apply replacements from bottom to top so indices don't shift
replacements.reverse();
for (const r of replacements) {
  content = content.slice(0, r.index) + r.text + content.slice(r.index);
}

fs.writeFileSync(filePath, content);
console.log(`Added slugs to ${replacements.length} posts.`);
