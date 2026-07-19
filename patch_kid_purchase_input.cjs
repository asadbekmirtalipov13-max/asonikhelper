const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// 1. add state
content = content.replace(
  /const \[confirmPurchaseItem, setConfirmPurchaseItem\] = useState<MarketItem \| null>\(null\);/,
  `const [confirmPurchaseItem, setConfirmPurchaseItem] = useState<MarketItem | null>(null);
  const [purchaseCustomInput, setPurchaseCustomInput] = useState("");`
);

// 2. add to handleBuyItem
content = content.replace(
  /const newPurchase: Purchase = \{\n\s+id: purchaseId,\n\s+productId: item\.id,\n\s+productTitle: item\.title,\n\s+productImage: item\.image,\n\s+points: finalPrice,\n\s+kidId: currentUser\.id,\n\s+kidName: currentUser\.name,\n\s+status: "pending",\n\s+createdAt: new Date\(\)\n\s+\};/,
  `const newPurchase: Purchase = {
          id: purchaseId,
          productId: item.id,
          productTitle: item.title,
          productImage: item.image,
          points: finalPrice,
          kidId: currentUser.id,
          kidName: currentUser.name,
          status: "pending",
          createdAt: new Date(),
          customInput: item.requiresInput ? purchaseCustomInput.trim() : undefined
        };`
);

// Clear the input when closed
content = content.replace(
  /setConfirmPurchaseItem\(null\);/g,
  `setConfirmPurchaseItem(null);\n      setPurchaseCustomInput("");`
);

// 3. update modal
content = content.replace(
  /\{\/\* PURCHASE CONFIRMATION MODAL \*\/\}\n\s+<AnimatePresence>([\s\S]*?)<\/AnimatePresence>/,
  `{/* PURCHASE CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmPurchaseItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4"
            >
              <div className="inline-flex p-4 bg-amber-50 rounded-full text-amber-500 text-4xl shadow-inner animate-bounce">
                {confirmPurchaseItem.image.startsWith("http") ? "🎁" : confirmPurchaseItem.image}
              </div>
              
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-base">Подтверждение покупки</h4>
                <p className="text-slate-500 text-xs leading-normal">
                  Вы действительно хотите купить <b>{confirmPurchaseItem.title}</b> за <span className="font-bold text-amber-600">🪙 {
                    (confirmPurchaseItem.discountPercentage && confirmPurchaseItem.discountUntil && (new Date(confirmPurchaseItem.discountUntil?.toDate ? confirmPurchaseItem.discountUntil.toDate() : confirmPurchaseItem.discountUntil).getTime() > Date.now())) 
                    ? Math.max(1, Math.floor(confirmPurchaseItem.points * (1 - confirmPurchaseItem.discountPercentage / 100))) 
                    : confirmPurchaseItem.points
                  } монет</span>?
                </p>
              </div>

              {confirmPurchaseItem.requiresInput && (
                <div className="text-left space-y-1 mt-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">{confirmPurchaseItem.inputLabel}</label>
                  <input
                    type="text"
                    required
                    value={purchaseCustomInput}
                    onChange={(e) => setPurchaseCustomInput(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Введите данные для покупки..."
                  />
                </div>
              )}

              <div className="bg-amber-50 p-3.5 border border-amber-100 rounded-2xl text-xs flex justify-between items-center mt-2">
                <span className="text-slate-600">Ваш баланс: <b>🪙 {currentUser.points}</b></span>
                <span className="text-slate-600">Останется: <b>🪙 {currentUser.points - ((confirmPurchaseItem.discountPercentage && confirmPurchaseItem.discountUntil && (new Date(confirmPurchaseItem.discountUntil?.toDate ? confirmPurchaseItem.discountUntil.toDate() : confirmPurchaseItem.discountUntil).getTime() > Date.now())) ? Math.max(1, Math.floor(confirmPurchaseItem.points * (1 - confirmPurchaseItem.discountPercentage / 100))) : confirmPurchaseItem.points)}</b></span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => {
                    setConfirmPurchaseItem(null);
                    setPurchaseCustomInput("");
                  }}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 font-bold rounded-2xl text-xs transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  onClick={handleBuyItem}
                  disabled={loading || (confirmPurchaseItem.requiresInput && !purchaseCustomInput.trim())}
                  className={\`flex-1 py-3 \${palette.bg} \${palette.hover} text-white font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50\`}
                >
                  Купить! 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>`
);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
