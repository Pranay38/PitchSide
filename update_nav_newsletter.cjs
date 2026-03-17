const fs = require('fs');

let hContent = fs.readFileSync('src/app/components/Header.tsx', 'utf8');
hContent = hContent.replace(/\{ label: "The Daily Fix", href: "\/daily-fix" \},/, (match) => {
    return match + '\n  { label: "Newsletter", href: "/topic/newsletter" },';
});

fs.writeFileSync('src/app/components/Header.tsx', hContent);
console.log("Updated Header.tsx with Newsletter link");

