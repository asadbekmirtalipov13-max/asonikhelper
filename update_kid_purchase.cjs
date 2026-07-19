const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const handleBuyItemRegex = /const handleBuyItem = async \(\) => \{[\s\S]+?\}\s*catch \(err\) \{[\s\S]+?\}\s*\};/;

const buyLogic = `const handleBuyItem = async () => {
    if (!confirmPurchaseItem || loading) return;
    const item = confirmPurchaseItem;

    const isDiscounted = item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now());
    const finalPrice = isDiscounted ? Math.max(1, Math.floor(item.points * (1 - item.discountPercentage! / 100))) : item.points;

    if (currentUser.points < finalPrice) {
      showAlert("Ой!", "Недостаточно баллов для покупки! Выполняйте больше квестов. 🧹");
      setConfirmPurchaseItem(null);
      setPurchaseCustomInput("");
      return;
    }

    setLoading(true);
    try {
      const kidRef = doc(db, "users", currentUser.id);
      const itemRef = doc(db, "marketplace", item.id);
      
      if (item.isChest) {
        // CHEST LOGIC
        const min = item.chestMin || 10;
        const max = item.chestMax || 100;
        const reward = Math.floor(Math.random() * (max - min + 1)) + min;
        
        const newBalance = currentUser.points - finalPrice + reward;
        await updateDoc(kidRef, { points: newBalance });
        
        // Log purchase transaction
        const txId = "tx-" + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, "transactions", txId), {
          id: txId,
          kidId: currentUser.id,
          kidName: currentUser.name,
          type: "expense",
          amount: finalPrice,
          description: \`Куплен Сундук: \${item.title}\`,
          createdAt: new Date(),
          balanceAfter: currentUser.points - finalPrice
        });
        
        // Log reward transaction
        const txRewardId = "tx-" + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, "transactions", txRewardId), {
          id: txRewardId,
          kidId: currentUser.id,
          kidName: currentUser.name,
          type: "income",
          amount: reward,
          description: \`Награда из Сундука: \${item.title}\`,
          createdAt: new Date(),
          balanceAfter: newBalance
        });
        
        if (item.stock > 0) {
          await updateDoc(itemRef, { stock: item.stock - 1 });
        }
        
        if (settings.telegramChatId) {
          await sendTelegramNotification(
            \`📦 <b>Открыт Сундук!</b>\\nРебенок: \${currentUser.name} \${currentUser.avatar}\\nСундук: <b>\${item.title}</b>\\nВыпало: 🪙 <b>\${reward} монет</b>\\nНовый баланс: <b>\${newBalance}</b>\`,
            settings.telegramChatId
          );
        }
        
        showAlert("Сундук Открыт! 📦", \`Вы открыли сундук и нашли там \${reward} монет! 🎉\`);
      } else {
        // REGULAR PURCHASE LOGIC
        const purchaseId = "purchase-" + Math.random().toString(36).substr(2, 9);
        
        await updateDoc(kidRef, { points: currentUser.points - finalPrice });
        
        await setDoc(doc(db, "purchases", purchaseId), {
          id: purchaseId,
          kidId: currentUser.id,
          kidName: currentUser.name,
          productId: item.id,
          productTitle: item.title,
          productImage: item.image,
          points: finalPrice,
          status: "pending",
          createdAt: new Date(),
          customInput: purchaseCustomInput || undefined
        });

        const txId = "tx-" + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, "transactions", txId), {
          id: txId,
          kidId: currentUser.id,
          kidName: currentUser.name,
          type: "expense",
          amount: finalPrice,
          description: \`Покупка: \${item.title}\`,
          createdAt: new Date(),
          balanceAfter: currentUser.points - finalPrice
        });

        if (item.stock > 0) {
          await updateDoc(itemRef, { stock: item.stock - 1 });
        }

        if (settings.telegramChatId) {
          await sendTelegramNotification(
            \`🎉 <b>Новая покупка в Маркете!</b>\\nПокупатель: \${currentUser.name} \${currentUser.avatar}\\nПриз: <b>\${item.title}</b>\\nСписано: 🪙 <b>\${finalPrice} монет</b>\\n\\n<i>Родители, пожалуйста, подтвердите выдачу в админ-панели!</i>\`,
            settings.telegramChatId
          );
        }

        showAlert("Поздравляем! 🎉", \`Успешно куплено! 🎉 С вашего счета списано \${finalPrice} монет. Ваша заявка успешно принята, ждите подтверждения!\`);
      }
      
      setConfirmPurchaseItem(null);
      setPurchaseCustomInput("");
    } catch (err) {
      console.error("Failed to purchase item:", err);
      showAlert("Ошибка", "Не удалось завершить покупку");
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(handleBuyItemRegex, buyLogic);
fs.writeFileSync('src/components/KidDashboard.tsx', content);
