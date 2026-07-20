const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/const min = item\.chestMin \|\| 10;/g, 'const min = item.chestMin || 1;');
content = content.replace(/const max = item\.chestMax \|\| 100;/g, 'const max = item.chestMax || 50;');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
