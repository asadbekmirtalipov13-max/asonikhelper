const fs = require('fs');
let parentDashContent = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

parentDashContent = parentDashContent.replace(/title: p\.productTitle,/g, 'title: p.giftedBy ? `🎁 Подарок (от ${p.giftedBy})` : p.productTitle,');

fs.writeFileSync('src/components/ParentDashboard.tsx', parentDashContent);
