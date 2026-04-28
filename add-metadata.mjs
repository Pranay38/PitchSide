import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const pages = walkSync(path.join(__dirname, 'app')).filter(f => f.endsWith('page.tsx'));

let count = 0;
for (const page of pages) {
  const content = fs.readFileSync(page, 'utf-8');
  if (!content.includes('export const metadata') && !content.includes('export async function generateMetadata') && !content.includes('export function generateMetadata')) {
    const routeName = path.basename(path.dirname(page));
    const isDynamic = routeName.includes('[') && routeName.includes(']');
    
    // Some pages have "use client" so they can't export metadata
    if (content.includes('"use client"') || content.includes("'use client'")) {
      console.log(`Skipping client component: ${page}`);
      continue;
    }

    const title = routeName === 'app' ? 'Home' : routeName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    const metadataTemplate = `\nexport const metadata = {\n  title: '${title} | The Touchline Dribble',\n  description: 'Explore ${title} on The Touchline Dribble, your go-to pitch for the beautiful game.'\n};\n`;

    fs.appendFileSync(page, metadataTemplate);
    console.log(`Added metadata to ${page}`);
    count++;
  }
}
console.log(`Added metadata to ${count} pages.`);
