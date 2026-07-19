const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/<Send, Gamepad2, Trophy, Ticket, Dice1, Play, ArrowUpCircle className/g, '<Send className');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
