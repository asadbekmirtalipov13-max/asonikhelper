const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/newSend, Gamepad2, Trophy, Ticket, Dice1, Play, ArrowUpCircleerBalance/g, 'newSenderBalance');
content = content.replace(/txSend, Gamepad2, Trophy, Ticket, Dice1, Play, ArrowUpCircleerId/g, 'txSenderId');
content = content.replace(/\/\/ 3\. Send, Gamepad2, Trophy, Ticket, Dice1, Play, ArrowUpCircle Telegram notify to Parent/g, '// 3. Send Telegram notify to Parent');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
