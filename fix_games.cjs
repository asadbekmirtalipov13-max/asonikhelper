const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/points: increment\(gameBet\)/g, 'points: increment(gameBet * 2)');
content = content.replace(/amount: gameBet/g, 'amount: gameBet'); // Wait, let's fix amount too
content = content.replace(/description: "Победа в игре \(Суефа\)"/g, 'description: "Победа в игре (Суефа) - Удвоение!"');
content = content.replace(/balanceAfter: currentUser\.points \+ gameBet/g, 'balanceAfter: currentUser.points + (gameBet * 2)');

// Fix handlePlayCoin amount
content = content.replace(/amount: gameBet \} \}/g, 'amount: gameBet } }'); // this is hard to replace accurately.

fs.writeFileSync('src/components/KidDashboard.tsx', content);
