const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/const \[loading, setLoading\] = useState\(false\);/, 
`const [loading, setLoading] = useState(false);
  const [openingChest, setOpeningChest] = useState<any>(null);
  const [processingOrder, setProcessingOrder] = useState<any>(null);`);

const buyRegex = /const handleBuyItem = async \(\) => \{[\s\S]+?showAlert\("Ошибка", "Не удалось завершить покупку"\);\n    \}\n  \};/;
const newBuy = `const handleBuyItem = async () => {
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
    setConfirmPurchaseItem(null); // Close modal immediately
    
    if (item.isChest) {
      setOpeningChest(item);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } else {
      setProcessingOrder(item);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

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
        
        setOpeningChest(null);
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

        setProcessingOrder(null);
        showAlert("Поздравляем! 🎉", \`Успешно куплено! 🎉 С вашего счета списано \${finalPrice} монет. Ваша заявка успешно принята, ждите подтверждения!\`);
      }
      
      setPurchaseCustomInput("");
    } catch (err) {
      console.error("Failed to purchase item:", err);
      setOpeningChest(null);
      setProcessingOrder(null);
      showAlert("Ошибка", "Не удалось завершить покупку");
    } finally {
      setLoading(false);
    }
  };`;
content = content.replace(buyRegex, newBuy);

// Fix the purchase confirm modal input required
const confirmModalRegex = /disabled=\{loading \|\| \(confirmPurchaseItem\.requiresInput && !purchaseCustomInput\.trim\(\)\)\}/;
content = content.replace(confirmModalRegex, `disabled={loading}`);

const inputRegex = /<input\n\s*type="text"\n\s*required/;
content = content.replace(inputRegex, `<input\n                    type="text"`);

// Add the optional note
const labelRegex = /<label className="block text-\[10px\] font-bold text-slate-400 uppercase">\{confirmPurchaseItem\.inputLabel\}<\/label>/;
content = content.replace(labelRegex, `<label className="block text-[10px] font-bold text-slate-400 uppercase">{confirmPurchaseItem.inputLabel}</label>\n                  <p className="text-[9px] text-slate-400 leading-tight">Если хотите получить товар лично, оставьте поле пустым или впишите 0.</p>`);

// Add the overlay for opening chest and processing order at the end of AnimatePresence
const uiRegex = /\{\/\* History Modal \*\/\}/;
const newUi = `{openingChest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: [0.8, 1.1, 1], rotate: [-5, 5, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
            className="text-8xl mb-6 select-none drop-shadow-2xl"
          >
            {openingChest.image && openingChest.image.startsWith("http") ? (
               <img src={openingChest.image} alt="chest" className="w-32 h-32 object-contain" />
            ) : openingChest.image || "🎁"}
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-black text-white text-center"
          >
            Открываем сундук...
          </motion.h2>
          <p className="text-white/60 font-medium mt-2">Пожалуйста, подождите!</p>
        </div>
      )}

      {processingOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="mb-6"
          >
            <RefreshCw className="w-16 h-16 text-indigo-500" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl md:text-2xl font-black text-white text-center"
          >
            Ваш заказ обрабатывается
          </motion.h2>
          <p className="text-white/60 font-medium mt-2">Пожалуйста, подождите...</p>
        </div>
      )}

      {/* History Modal */}`;
content = content.replace(uiRegex, newUi);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
