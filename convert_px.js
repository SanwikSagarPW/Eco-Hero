const fs = require('fs');
const path = 'src/components/HUD.tsx';

let content = fs.readFileSync(path, 'utf8');

// Replacements
content = content.replace(/text-\[10px\]/g, 'text-[0.625rem]');
content = content.replace(/text-\[9px\]/g, 'text-[0.5625rem]');
content = content.replace(/text-\[8px\]/g, 'text-[0.5rem]');
content = content.replace(/text-\[7px\]/g, 'text-[0.4375rem]');

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
