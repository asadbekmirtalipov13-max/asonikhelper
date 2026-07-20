const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const newFunction = `  const handleGiftItem = async () => {
    if (!giftPurchaseItem || !giftTargetId || loading) return;
    const item = giftPurchaseItem;
    const customInput = purchaseCustomInput;
    
    const targetKid = kids.find(k => k.id === giftTargetId);
    if (!targetKid) return;

    const isDiscounted = item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now());
    const finalPrice = isDiscounted ? Math.max(1, Math.floor(item.points * (1 - item.discountPercentage / 100))) : item.points;

    if (currentUser.points < finalPrice) {
      showAlert("Ой!", "Недостаточно баллов для покупки подарка!");
      return;
    }

    setGiftPurchaseItem(null);
    setPurchaseCustomInput("");
    setLoading(true);
    setProcessingOrder(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const kidRef = doc(db, "users", currentUser.id);
      const itemRef = doc(db, "marketplace", item.id);
      
      // Always create a purchase record, but for target kid
      const purchaseId = "purchase-" + Math.random().toString(36).substr(2, 9);
      
      await updateDoc(kidRef, { points: currentUser.points - finalPrice });
      
      await setDoc(doc(db, "purchases", purchaseId), {
        id: purchaseId,
        kidId: targetKid.id,
        kidName: targetKid.name,
        productId: item.id,
        productTitle: item.title,
        productImage: item.image,
        points: finalPrice, // It's free for them, but we record cost
        status: "pending",
        createdAt: new Date(),
        customInput: customInput || undefined,
        giftedBy: currentUser.name
      });

      const txId = "tx-" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "transactions", txId), {
        id: txId,
        kidId: currentUser.id,
        kidName: currentUser.name,
        type: "expense",
        amount: finalPrice,
        description: \`Подарок для \${targetKid.name}: \${item.title}\`,
        createdAt: new Date(),
        balanceAfter: currentUser.points - finalPrice
      });

      if (item.stock > 0) {
        await updateDoc(itemRef, { stock: item.stock - 1 });
      }

      if (settings.telegramChatId) {
        await sendTelegramNotification(
          \`🎁 <b>Новый Подарок!</b>\\nОт: \${currentUser.name} \${currentUser.avatar}\\nКому: \${targetKid.name} \${targetKid.avatar}\\nПодарок: <b>\${item.title}</b>\\nПотрачено: 🪙 <b>\${finalPrice} монет</b>\\n\\n<i>Родители, подтвердите выдачу подарка в админ-панели!</i>\`,
          settings.telegramChatId
        );
      }
      
      // Notify the receiver
      const notifRef = doc(collection(db, "notifications"));
      await setDoc(notifRef, {
        kidId: targetKid.id,
        type: "message",
        title: \`🎁 Вам подарок от \${currentUser.name}!\`,
        text: \`Вы получили подарок: \${item.title}!\`,
        createdAt: new Date(),
        read: false
      });

      showAlert("Поздравляем! 🎉", \`Вы успешно подарили \${item.title} брату/сестре (\${targetKid.name})!\`);
      
    } catch (err) {
      console.error("Failed to gift item:", err);
      showAlert("Ошибка", "Не удалось отправить подарок.");
    } finally {
      setLoading(false);
      setProcessingOrder(null);
    }
  };
`;

content = content.replace('// 3. Purchase logic', newFunction + '\n  // 3. Purchase logic');

// Now add the Gift button in the UI next to Купить
const uiRegex = /<button\n\s*onClick=\{\(\) => setConfirmPurchaseItem\(item\)\}\n\s*className=\{\`w-full sm:w-auto py-1\.5 sm:py-2 px-2\.5 sm:px-4 text-\[10px\] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer \$\{([\s\S]*?)\}\`\}\n\s*>\n\s*<Gift className="w-3 h-3 sm:w-3\.5 sm:h-3\.5" \/>\n\s*Купить\n\s*<\/button>/;

const uiReplacement = `<button
                        onClick={() => setConfirmPurchaseItem(item)}
                        className={\`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 text-[10px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer \${$1}\`}
                      >
                        <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        Купить
                      </button>
                      {kids.length > 0 && !item.isChest && (
                        <button
                          onClick={() => setGiftPurchaseItem(item)}
                          className={\`flex-1 py-1.5 sm:py-2 px-2 sm:px-3 text-[10px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer \${$1 ? "bg-slate-100 text-slate-400 border border-slate-200/50" : "bg-sky-500 hover:bg-sky-600 text-white"}\`}
                        >
                          <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          Подарить
                        </button>
                      )}`;

content = content.replace(uiRegex, uiReplacement);

// Add the modal for gifting
const modalRegex = /\{\/\* PURCHASE CONFIRMATION MODAL \*\/\}/;
const modalReplacement = `{/* GIFT CONFIRMATION MODAL */}
      <AnimatePresence>
        {giftPurchaseItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4"
            >
              <div className="inline-flex p-4 bg-sky-50 rounded-full text-sky-500 text-4xl shadow-inner animate-bounce">
                {giftPurchaseItem.image.startsWith("http") ? "🎁" : giftPurchaseItem.image}
              </div>
              
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-base">Подарить товар</h4>
                <p className="text-slate-500 text-xs leading-normal">
                  Вы собираетесь купить <b>{giftPurchaseItem.title}</b> в подарок! Цена: <span className="font-bold text-amber-600">🪙 {
                    (giftPurchaseItem.discountPercentage && giftPurchaseItem.discountUntil && (new Date(giftPurchaseItem.discountUntil?.toDate ? giftPurchaseItem.discountUntil.toDate() : giftPurchaseItem.discountUntil).getTime() > Date.now())) 
                    ? Math.max(1, Math.floor(giftPurchaseItem.points * (1 - giftPurchaseItem.discountPercentage / 100))) 
                    : giftPurchaseItem.points
                  } монет</span>.
                </p>
              </div>

              <div className="text-left space-y-2">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Кому подарить?</label>
                <select 
                  value={giftTargetId}
                  onChange={e => setGiftTargetId(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-sky-500"
                >
                  <option value="">-- Выберите брата / сестру --</option>
                  {kids.map(k => (
                    <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>
                  ))}
                </select>
              </div>

              {giftPurchaseItem.requiresInput && (
                <div className="text-left space-y-1 mt-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">{giftPurchaseItem.inputLabel || "Данные для покупки"}</label>
                  <p className="text-[9px] text-slate-400 leading-tight">Заполните данные для получателя.</p>
                  <input
                    type="text"
                    value={purchaseCustomInput}
                    onChange={(e) => setPurchaseCustomInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500"
                    placeholder="Введите данные для покупки..."
                  />
                </div>
              )}

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setGiftPurchaseItem(null);
                    setGiftTargetId("");
                    setPurchaseCustomInput("");
                  }}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 font-bold rounded-2xl text-xs transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  onClick={() => {
                    if (!loading && giftTargetId) {
                      handleGiftItem();
                    }
                  }}
                  disabled={loading || !giftTargetId}
                  className={\`flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl text-xs transition-all shadow-sm \${loading || !giftTargetId ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}\`}
                >
                  {loading ? 'Обработка...' : 'Подарить! 🎁'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PURCHASE CONFIRMATION MODAL */}`;

content = content.replace(modalRegex, modalReplacement);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
