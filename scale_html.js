const fs = require('fs');
const path = require('path');

const filePath = path.resolve('chelsea_chaos_reel.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Increase all font sizes by ~30-40%
content = content.replace(/font-size:\s*(\d+)px/g, (match, p1) => {
  let size = parseInt(p1);
  if (size === 280 || size === 320) return match; // Leave huge bg text alone
  if (size >= 10 && size <= 18) size = Math.round(size * 1.4); // body text
  else if (size > 18 && size <= 40) size = Math.round(size * 1.3); // subheaders
  else if (size > 40 && size <= 100) size = Math.round(size * 1.25); // headers
  return `font-size: ${size}px`;
});

// 2. Increase margins and padding to spread things out vertically
content = content.replace(/margin-top:\s*(\d+)px/g, (match, p1) => {
  let val = parseInt(p1);
  return `margin-top: ${Math.round(val * 1.5)}px`;
});

content = content.replace(/margin-bottom:\s*(\d+)px/g, (match, p1) => {
  let val = parseInt(p1);
  return `margin-bottom: ${Math.round(val * 1.5)}px`;
});

content = content.replace(/gap:\s*(\d+)px/g, (match, p1) => {
  let val = parseInt(p1);
  return `gap: ${Math.round(val * 1.5)}px`;
});

// 3. Make content-pad use space-evenly so it automatically spreads out in the taller 9:16 frame
content = content.replace(/justify-content:center;/g, 'justify-content:center; padding-top: 80px; padding-bottom: 80px;');

fs.writeFileSync(filePath, content, 'utf8');
console.log("HTML successfully updated to spread out content and enlarge text!");
