const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /\{\/\* HISTORY TAB \*\/\}[\s\S]*?\{\/\* ACHIEVEMENTS TAB \*\/\}/;
content = content.replace(regex, '{/* ACHIEVEMENTS TAB */}');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
