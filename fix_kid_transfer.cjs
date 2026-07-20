const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /t\.title\.includes\("Перевод"\)/g;
content = content.replace(regex, '(t.title || t.description || "").includes("Перевод")');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
