const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /\{\/\* Achievements & Games Tabs \*\/\}/; // Wait, I didn't add these tabs completely yet.
