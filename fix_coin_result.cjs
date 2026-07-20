const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/setCoinResult\(\{ player: choice, result: botChoice as "heads" \| "tails", outcome \}\);/,
'setCoinResult({ player: choice, bot: botChoice, outcome, amount: gameBet });');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
