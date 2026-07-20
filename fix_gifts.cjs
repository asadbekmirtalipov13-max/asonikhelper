const fs = require('fs');
let kidDashContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// Fix handleBuyItemForSibling
kidDashContent = kidDashContent.replace(
  /if \(settings\.telegramChatId\) \{\s*await sendTelegramNotification\([\s\S]*?\);\s*\}/g,
  `if (settings.telegramChatId) {
        try {
          await sendTelegramNotification(
            \`🎁 <b>Новый заказ/подарок!</b>\\nПользователь: \${currentUser.name}\\nТовар: \${item.title}\\nСписано: 🪙 \${finalPrice} монет\`,
            settings.telegramChatId
          );
        } catch(e) { console.error("TG error", e); }
      }`
);

// We should properly fix telegram notification in handleBuyItemForSibling
const tgGiftNotif = `if (settings.telegramChatId) {
        try {
          await sendTelegramNotification(
            \`🎁 <b>Новый Подарок!</b>\\nОт: \${currentUser.name} \${currentUser.avatar}\\nКому: \${targetKid.name} \${targetKid.avatar}\\nПодарок: <b>\${item.title}</b>\\nПотрачено: 🪙 <b>\${finalPrice} монет</b>\\n\\n<i>Родители, подтвердите выдачу подарка в админ-панели!</i>\`,
            settings.telegramChatId
          );
        } catch(e) { console.error("TG error", e); }
      }`;

kidDashContent = kidDashContent.replace(
  /if \(settings\.telegramChatId\) \{\s*try \{\s*await sendTelegramNotification\([\s\S]*?Новый заказ\/подарок![\s\S]*?\);\s*\} catch\(e\) \{ console\.error\("TG error", e\); \}\s*\}/g,
  `if (settings.telegramChatId) {
        try {
          await sendTelegramNotification(
            \`🛒 <b>Новый заказ!</b>\\nПользователь: \${currentUser.name}\\nТовар: \${item.title}\\nСписано: 🪙 \${finalPrice} монет\`,
            settings.telegramChatId
          );
        } catch(e) { console.error("TG error", e); }
      }`
);

// Add the specific gift one back
const wrongGiftTg = `if (settings.telegramChatId) {
        try {
          await sendTelegramNotification(
            \`🛒 <b>Новый заказ!</b>\\nПользователь: \${currentUser.name}\\nТовар: \${item.title}\\nСписано: 🪙 \${finalPrice} монет\`,
            settings.telegramChatId
          );
        } catch(e) { console.error("TG error", e); }
      }
      
      // Notify the receiver`;
const correctGiftTg = \`\${tgGiftNotif}
      
      // Notify the receiver\`;

kidDashContent = kidDashContent.replace(wrongGiftTg, correctGiftTg);

fs.writeFileSync('src/components/KidDashboard.tsx', kidDashContent);
