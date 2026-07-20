const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /  const handleBuyItem = async \(\) => \{\n    if \(!confirmPurchaseItem \|\| loading\) return;/;

const replacement = `  const handleBuyItem = async () => {
    if (!confirmPurchaseItem || loading) return;`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
