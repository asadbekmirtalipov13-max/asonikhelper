const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /\{\/\* Transfer Coins \*\/\}[\s\S]+?\{\/\* Quests \& Purchase history lists \*\/\}/;
content = content.replace(regex, "{/* Quests & Purchase history lists */}");

fs.writeFileSync('src/components/KidDashboard.tsx', content);
