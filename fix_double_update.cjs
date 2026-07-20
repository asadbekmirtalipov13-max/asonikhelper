const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/await updateDoc\(kidRef, \{ points: currentUser\.points - finalPrice \}\);\n\s*await updateDoc\(kidRef, \{ points: currentUser\.points - finalPrice \}\);/g, 'await updateDoc(kidRef, { points: currentUser.points - finalPrice });');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
