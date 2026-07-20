const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

content = content.replace(/let discountPercentage = undefined;/g, 'let discountPercentage = null;');
content = content.replace(/let discountUntil = undefined;/g, 'let discountUntil = null;');

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
