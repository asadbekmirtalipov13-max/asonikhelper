const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/<RefreshCw, RotateCcw className/g, '<RefreshCw className');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
