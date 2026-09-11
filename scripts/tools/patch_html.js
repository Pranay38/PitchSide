const fs = require('fs');
const path = require('path');

const filePath = path.resolve('chelsea_chaos_reel.html');
let content = fs.readFileSync(filePath, 'utf8');

// The main issues are the massive words overflowing the 420px container (like CHELSEA'S, SLAUGHTERHOUSE)
// Let's reduce any font-size between 60px and 110px back down by dividing by 1.25.
content = content.replace(/font-size:\s*(\d+)px/g, (match, p1) => {
  let size = parseInt(p1);
  if (size >= 60 && size <= 110) {
    size = Math.round(size / 1.25); // reverse the scaling for headers
  }
  return `font-size: ${size}px`;
});

// Let's also restore the 'justify-content:center;' to prevent vertical overflow clipping
content = content.replace(/justify-content:center;\s*padding-top:\s*80px;\s*padding-bottom:\s*80px;/g, 'justify-content:center;');

fs.writeFileSync(filePath, content, 'utf8');
console.log("HTML successfully patched to fix overflowing text and spacing!");
