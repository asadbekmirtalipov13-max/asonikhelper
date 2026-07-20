const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/customInput: customInput \|\| undefined/g, 'customInput: customInput || ""');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
