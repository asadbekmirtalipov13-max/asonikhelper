const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

content = content.replace(/useState\(10\);/g, 'useState(1);');
content = content.replace(/useState\(100\);/g, 'useState(50);');
content = content.replace(/item\.chestMin \|\| 10/g, 'item.chestMin || 1');
content = content.replace(/item\.chestMax \|\| 100/g, 'item.chestMax || 50');
content = content.replace(/setItemChestMin\(10\);/g, 'setItemChestMin(1);');
content = content.replace(/setItemChestMax\(100\);/g, 'setItemChestMax(50);');
content = content.replace(/setEditItemChestMin\(10\);/g, 'setEditItemChestMin(1);');
content = content.replace(/setEditItemChestMax\(100\);/g, 'setEditItemChestMax(50);');

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
