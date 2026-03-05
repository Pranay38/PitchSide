const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir('./src/app', function (filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
        let content = fs.readFileSync(filePath, 'utf8');

        let originalContent = content;

        // Tailwind classes with arbitrary values
        content = content.replace(/\[#16A34A\]/gi, "accent-theme");
        content = content.replace(/\[#22c55e\]/gi, "accent-light");
        content = content.replace(/\[#4ade80\]/gi, "accent-light");

        // Tailwind standard green classes (to accent)
        content = content.replace(/bg-green-600/g, "bg-accent-theme");
        content = content.replace(/text-green-600/g, "text-accent-theme");
        content = content.replace(/border-green-600/g, "border-accent-theme");
        content = content.replace(/from-green-600/g, "from-accent-theme");
        content = content.replace(/to-green-600/g, "to-accent-theme");

        content = content.replace(/bg-green-500/g, "bg-accent-theme");
        content = content.replace(/text-green-500/g, "text-accent-theme");
        content = content.replace(/border-green-500/g, "border-accent-theme");
        content = content.replace(/from-green-500/g, "from-accent-theme");
        content = content.replace(/to-green-500/g, "to-accent-theme");

        content = content.replace(/bg-green-400/g, "bg-accent-light");
        content = content.replace(/text-green-400/g, "text-accent-light");
        content = content.replace(/border-green-400/g, "border-accent-light");
        content = content.replace(/from-green-400/g, "from-accent-light");
        content = content.replace(/to-green-400/g, "to-accent-light");

        // React inline styles hex colors
        content = content.replace(/#16A34A/gi, "var(--theme-primary)");
        content = content.replace(/#22c55e/gi, "var(--theme-light)");
        content = content.replace(/#4ade80/gi, "var(--theme-light)");

        if (originalContent !== content) {
            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
});
console.log("Color replacement complete.");
