const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/balanceAfter: currentUser\.points - finalPrice\n\s*\}\);\n\s*if \(item\.stock > 0\) \{/g, 'balanceAfter: currentUser.points - finalPrice\n        });\n\n        await updateDoc(doc(db, "users", currentUser.id), { points: currentUser.points - finalPrice });\n\n        if (item.stock > 0) {');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
