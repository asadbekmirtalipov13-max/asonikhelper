const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/\{rpsResult\.outcome === "win" \? \`\+\$\{gameBet\} 🪙 ВЫИГРЫШ!\` : rpsResult\.outcome === "lose" \? \`\-\$\{gameBet\} 🪙 ПРОИГРЫШ\` : "НИЧЬЯ"\}/g, '{rpsResult.outcome === "win" ? `+${gameBet * 2} 🪙 ВЫИГРЫШ!` : rpsResult.outcome === "lose" ? `-${gameBet} 🪙 ПРОИГРЫШ` : "НИЧЬЯ"}');

content = content.replace(/\{coinResult\.outcome === "win" \? \`\+\$\{gameBet\} 🪙 ВЫИГРЫШ!\` : \`\-\$\{gameBet\} 🪙 ПРОИГРЫШ\`\}/g, '{coinResult.outcome === "win" ? `+${gameBet * 2} 🪙 ВЫИГРЫШ!` : `-${gameBet} 🪙 ПРОИГРЫШ`}');

// Also update the transaction amounts to match gameBet * 2
content = content.replace(/amount: gameBet,\n\s*description: "Победа в игре \(Суефа\) - Удвоение!"/g, 'amount: gameBet * 2,\n            description: "Победа в игре (Суефа) - Удвоение!"');
content = content.replace(/amount: gameBet,\n\s*description: "Победа в игре \(Орел или Решка\)"/g, 'amount: gameBet * 2,\n            description: "Победа в игре (Орел или Решка) - Удвоение!"');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
