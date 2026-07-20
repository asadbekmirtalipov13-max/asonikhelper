const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const balanceRegex = /<div className="flex justify-between items-start z-10 relative">\n\s*<div>\n\s*<div className="text-\[9px\] font-black text-amber-100 uppercase tracking-wider">Мой баланс<\/div>\n\s*<div className="text-xl md:text-3xl font-black mt-0\.5 tracking-tight">🪙 \{currentUser\.points\}<\/div>\n\s*<\/div>\n\s*<\/div>/;

content = content.replace(balanceRegex, 
`<div className="flex justify-between items-start z-10 relative">
            <div>
              <div className="text-[9px] font-black text-amber-100 uppercase tracking-wider">Мой баланс</div>
              <div className="text-xl md:text-3xl font-black mt-0.5 tracking-tight">🪙 {currentUser.points}</div>
            </div>
            <button 
              onClick={() => setIsHistoryModalOpen(true)}
              className="p-2 bg-black/10 hover:bg-black/20 rounded-xl transition-colors cursor-pointer"
              title="История операций"
            >
              <RotateCcw className="w-5 h-5 text-white/90" />
            </button>
          </div>`);

// Also add the history modal at the end of the file.
// First, find the end of the component return.
const endRegex = /<\/div>\n\s*\);\n\}/;
const historyModal = `
      {/* History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-indigo-500" />
                  История операций (баланс)
                </h3>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto space-y-3 bg-slate-50 divide-y divide-slate-100">
                {transactions.filter(t => t.kidId === currentUser.id).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-white rounded-2xl border border-slate-100">
                    История операций пуста. Зарабатывайте монеты на квестах! 💪
                  </div>
                ) : (
                  transactions.filter(t => t.kidId === currentUser.id).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map((tx) => {
                    const isIncome = tx.type === "income";
                    let dateStr = "Неизвестно";
                    if (tx.createdAt) {
                      try {
                        const dateObj = tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);
                        dateStr = dateObj.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
                      } catch (e) {}
                    }
                    return (
                      <div key={tx.id} className="py-3 flex justify-between items-center gap-3">
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-700 truncate">{tx.description}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{dateStr} • Баланс: {tx.balanceAfter} 🪙</div>
                        </div>
                        <span className={\`text-xs font-bold px-2.5 py-1 rounded-md shrink-0 border \${
                          isIncome 
                            ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                            : "text-rose-700 bg-rose-50 border-rose-100"
                        }\`}>
                          {isIncome ? "+" : "-"}{tx.amount} 🪙
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}`;

content = content.replace(endRegex, historyModal);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
