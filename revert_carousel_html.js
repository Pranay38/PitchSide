const fs = require('fs');
const path = require('path');

const filePath = path.resolve('chelsea_chaos_carousel.html');
let content = fs.readFileSync(filePath, 'utf8');

// Reverse the body font-size increases
content = content.replace(/font-size:\s*(\d+)px/g, (match, p1) => {
  let size = parseInt(p1);
  if (size === 280 || size === 320) return match; 
  if (size >= 14 && size <= 25) size = Math.round(size / 1.4); // revert body text
  else if (size > 25 && size <= 52) size = Math.round(size / 1.3); // revert subheaders
  return `font-size: ${size}px`;
});

// Reverse the margin and gap increases
content = content.replace(/margin-top:\s*(\d+)px/g, (match, p1) => {
  return `margin-top: ${Math.round(parseInt(p1) / 1.5)}px`;
});
content = content.replace(/margin-bottom:\s*(\d+)px/g, (match, p1) => {
  return `margin-bottom: ${Math.round(parseInt(p1) / 1.5)}px`;
});
content = content.replace(/gap:\s*(\d+)px/g, (match, p1) => {
  return `gap: ${Math.round(parseInt(p1) / 1.5)}px`;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log("Carousel HTML successfully reverted to base 4:5 sizing!");
