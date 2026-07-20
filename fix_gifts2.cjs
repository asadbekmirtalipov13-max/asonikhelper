const fs = require('fs');
let kidDashContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// Fix handleBuyItemForSibling specifically
const sendGiftStart = kidDashContent.indexOf('const handleBuyItemForSibling = async');
const sendGiftEnd = kidDashContent.indexOf('const handleBuyItem = async');

if (sendGiftStart !== -1 && sendGiftEnd !== -1) {
  let giftLogic = kidDashContent.substring(sendGiftStart, sendGiftEnd);
  
  giftLogic = giftLogic.replace(
    /if \(settings\.telegramChatId\) \{\s*await sendTelegramNotification\([\s\S]*?\);\s*\}/,
    `if (settings.telegramChatId) {
        try {
          await sendTelegramNotification(
            \`🎁 <b>Новый Подарок!</b>\\nОт: \${currentUser.name} \${currentUser.avatar}\\nКому: \${targetKid.name} \${targetKid.avatar}\\nПодарок: <b>\${item.title}</b>\\nПотрачено: 🪙 <b>\${finalPrice} монет</b>\\n\\n<i>Родители, подтвердите выдачу подарка в админ-панели!</i>\`,
            settings.telegramChatId
          );
        } catch(e) { console.error("TG err", e); }
      }`
  );
  
  kidDashContent = kidDashContent.substring(0, sendGiftStart) + giftLogic + kidDashContent.substring(sendGiftEnd);
}

// Fix handleBuyItem specifically
const buyItemStart = kidDashContent.indexOf('const handleBuyItem = async');
const buyItemEnd = kidDashContent.indexOf('const handleClaimAchievement = async');

if (buyItemStart !== -1 && buyItemEnd !== -1) {
  let buyLogic = kidDashContent.substring(buyItemStart, buyItemEnd);
  
  buyLogic = buyLogic.replace(
    /if \(settings\.telegramChatId\) \{\s*await sendTelegramNotification\([\s\S]*?\);\s*\}/,
    `if (settings.telegramChatId) {
        try {
          await sendTelegramNotification(
            \`🛒 <b>Новый заказ!</b>\\nПользователь: \${currentUser.name}\\nТовар: \${item.title}\\nСписано: 🪙 \${finalPrice} монет\\n\\n<i>Родители, подтвердите выдачу товара в админ-панели!</i>\`,
            settings.telegramChatId
          );
        } catch(e) { console.error("TG err", e); }
      }`
  );
  
  kidDashContent = kidDashContent.substring(0, buyItemStart) + buyLogic + kidDashContent.substring(buyItemEnd);
}

fs.writeFileSync('src/components/KidDashboard.tsx', kidDashContent);
