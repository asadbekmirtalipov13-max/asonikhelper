const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(
  /if \(newStreak === 15 \|\| newStreak === 30 \|\| newStreak === 29\) \{[\s\S]+?isChestDay = true;\n\s+\}/,
  `if (newStreak === 15 || newStreak === 30) {
        chestPoints = Math.floor(Math.random() * 50) + 1; // 1 to 50 random coins
        isChestDay = true;
      }
      
      let wonMarketItem = null;
      if (newStreak === 29) {
        // Random prize from market
        if (marketItems.length > 0) {
           wonMarketItem = marketItems[Math.floor(Math.random() * marketItems.length)];
           isChestDay = true;
        }
      }`
);

// We need to issue the wonMarketItem if it exists
content = content.replace(
  /const totalEarnedToday = basePoints \+ chestPoints;/,
  `const totalEarnedToday = basePoints + chestPoints;
      
      if (wonMarketItem) {
        const purchaseId = "purchase-" + Math.random().toString(36).substr(2, 9);
        const newPurchase: Purchase = {
          id: purchaseId,
          productId: wonMarketItem.id,
          productTitle: wonMarketItem.title,
          productImage: wonMarketItem.image,
          points: 0, // Free prize
          kidId: currentUser.id,
          kidName: currentUser.name,
          status: "pending",
          createdAt: new Date()
        };
        await setDoc(doc(db, "purchases", purchaseId), newPurchase);
        
        if (settings.telegramChatId) {
          await sendTelegramNotification(
            \`🎁 <b>Ребенок выиграл приз из магазина!</b>\\nРебенок: \${currentUser.name} \${currentUser.avatar}\\nДень: 29\\nПриз: <b>\${wonMarketItem.title}</b>\\n\\n<i>Выдайте его в админ-панели!</i>\`,
            settings.telegramChatId
          );
        }
      }`
);

content = content.replace(
  /if \(isChestDay\) \{\n\s+showAlert\([\s\S]+?Ура!"\n\s+\);\n\s+\}/,
  `if (isChestDay) {
        if (wonMarketItem) {
          showAlert(
            "СЕКРЕТНЫЙ ПРИЗ! 🎁🎉",
            \`Ты успешно отметился на \${newStreak}-й день! Тебе начислено \${basePoints} монет за серию. А ТАКЖЕ ты выиграл бесплатный приз из магазина: \${wonMarketItem.title}! Жди подтверждения от родителей!\`
          );
        } else {
          showAlert(
            "ОТКРЫТ СУНДУК! 🎁🎉",
            \`Ты успешно отметился на \${newStreak}-й день! Тебе начислено \${basePoints} монет за серию, а также ты открыл Сундук и получил еще +\${chestPoints} монет! Итого получено: +\${totalEarnedToday} монет! Ура!\`
          );
        }
      }`
);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
