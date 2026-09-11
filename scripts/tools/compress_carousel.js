const fs = require('fs');
const path = require('path');

const filePath = path.resolve('chelsea_chaos_carousel.html');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Compress the master container padding to save 54px of height
content = content.replace(/\.content-pad\s*\{\s*padding:\s*40px\s*24px\s*54px;\s*\}/g, '.content-pad { padding: 15px 24px 20px; }');

// 2. Compress the padding inside the shock-boxes to save vertical space
content = content.replace(/padding:\s*16px;/g, 'padding: 10px 16px;');
content = content.replace(/padding:\s*24px;/g, 'padding: 14px 24px;');

// 3. Compress large vertical margins
content = content.replace(/margin-top:\s*30px;/g, 'margin-top: 15px;');
content = content.replace(/margin-top:\s*20px;/g, 'margin-top: 10px;');
content = content.replace(/margin-top:\s*45px;/g, 'margin-top: 20px;');

// 4. Compress flex gaps
content = content.replace(/gap:\s*16px;/g, 'gap: 8px;');
content = content.replace(/gap:\s*24px;/g, 'gap: 12px;');

// 5. Slightly reduce the headline font size so multi-line headlines take less height
content = content.replace(/font-size:\s*52px;/g, 'font-size: 44px;');
content = content.replace(/font-size:\s*53px;/g, 'font-size: 44px;');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully compressed vertical spacing in chelsea_chaos_carousel.html!");
