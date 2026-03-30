import fs from 'fs';
import path from 'path';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        if (file === 'node_modules' || file === '.next') return;
        const filepath = dir + '/' + file;
        const stat = fs.statSync(filepath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walkDir(filepath));
        } else { 
            if (filepath.endsWith('.ts') || filepath.endsWith('.tsx')) {
                results.push(filepath);
            }
        }
    });
    return results;
}

const files = walkDir('./src');
let count = 0;

for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const newContent = content.replace(/\/post\/\$\{([a-zA-Z0-9_]+)\.id\}/g, '/post/${$1.slug || $1.id}');
    if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        count++;
        console.log(`Updated ${file}`);
    }
}
console.log(`Updated ${count} files.`);
