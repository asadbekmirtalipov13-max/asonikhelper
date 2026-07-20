const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/\{transactions\.filter\(t => t\.kidId === currentUser\.id\)\.length === 0 \?/g, '{transactions.filter(t => t.kidId === currentUser.id).filter(t => historyFilter === "all" ? true : t.type === historyFilter).length === 0 ?');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
