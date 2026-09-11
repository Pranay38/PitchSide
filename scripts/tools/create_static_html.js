const fs = require('fs');
const path = require('path');

const srcPath = path.resolve('chelsea_chaos_reel.html');
const destPath = path.resolve('chelsea_chaos_carousel.html');

let content = fs.readFileSync(srcPath, 'utf8');

// Replace CSS definitions for animations to be fully visible and static
content = content.replace(/\.anim-fade\s*\{\s*opacity:0;\s*\}/g, '.anim-fade { opacity:1; }');
content = content.replace(/\.anim-left\s*\{\s*opacity:0;\s*transform:translateX\(20px\);\s*\}/g, '.anim-left { opacity:1; transform:none; }');
content = content.replace(/\.anim-up\s*\{\s*opacity:0;\s*transform:translateY\(20px\);\s*\}/g, '.anim-up { opacity:1; transform:none; }');
content = content.replace(/\.anim-scale\s*\{\s*opacity:0;\s*transform:scale\(0\.9\);\s*\}/g, '.anim-scale { opacity:1; transform:none; }');

// Remove the active animation triggers
content = content.replace(/\.slide\.active\s*\.anim-(fade|left|up|scale)\s*\{\s*animation:[^}]+\}/g, '');

// Fix the slide base visibility and transitions
content = content.replace(/\.slide\s*\{\s*min-width:100%;\s*height:100%;\s*position:relative;\s*overflow:hidden;\s*opacity:0;\s*transition:\s*opacity\s*0\.5s;\s*\}/g, 
  '.slide { min-width:100%; height:100%; position:relative; overflow:hidden; opacity:1; transition:none; }');

// Fix the carousel track transition
content = content.replace(/transition:\s*transform\s*0\.5s\s*cubic-bezier[^;]+;/g, 'transition:none;');

// Remove infinite glitch/pulse animations
content = content.replace(/animation:\s*glitch\s*3s\s*infinite;/g, '');
content = content.replace(/animation:\s*pulse\s*2s\s*infinite;/g, '');

fs.writeFileSync(destPath, content, 'utf8');
console.log("Created chelsea_chaos_carousel.html with all animations disabled!");
