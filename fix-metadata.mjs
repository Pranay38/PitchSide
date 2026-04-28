import fs from 'fs';
import path from 'path';

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBADF') filelist.push(dirFile);
    }
  });
  return filelist;
};

const pages = walkSync('app').filter(f => f.endsWith('page.tsx'));

let count = 0;
for (const page of pages) {
  let content = fs.readFileSync(page, 'utf-8');
  
  if (content.includes('export const metadata') || content.includes('generateMetadata')) {
    continue;
  }

  const routeName = path.basename(path.dirname(page));
  const title = routeName === 'app' ? 'Home' : routeName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const metadataTemplate = `\nexport const metadata = {\n  title: '${title} | The Touchline Dribble',\n  description: 'Explore ${title} on The Touchline Dribble, your go-to pitch for the beautiful game.'\n};\n`;

  if (content.startsWith('"use client"') || content.startsWith("'use client'")) {
    // 1. Remove use client from page.tsx
    content = content.replace(/^["']use client["'];?\n*/, '');
    
    // 2. Find the imported component
    const match = content.match(/import\s+\{([^}]+)\}\s+from\s+["']([^"']+)["']/);
    if (match) {
      let [_, imports, importPath] = match;
      if (importPath.startsWith('@/app/pages/')) {
        const actualPagePath = path.join('src', importPath.replace('@/', '') + '.tsx');
        if (fs.existsSync(actualPagePath)) {
          let actualContent = fs.readFileSync(actualPagePath, 'utf-8');
          if (!actualContent.startsWith('"use client"') && !actualContent.startsWith("'use client'")) {
            fs.writeFileSync(actualPagePath, `"use client";\n` + actualContent);
          }
        }
      }
    }
  }

  content += metadataTemplate;
  fs.writeFileSync(page, content);
  console.log(`Added metadata to ${page}`);
  count++;
}
console.log(`Updated ${count} pages.`);
