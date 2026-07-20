const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// The bug starts at line 2498
const bugStart = content.indexOf(';\n                      } catch (e) {}');

if (bugStart !== -1) {
  content = content.substring(0, bugStart);
}

// Now append the missing Games tab and History modal
const missingCode = `
      {/* GAMES TAB */}
      {activeTab === "games" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-indigo-500" />
              Игры
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rock Paper Scissors Card */}
            <div 
              onClick={() => { setActiveGame("rps"); setGameBet(10); setRpsResult(null); }}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-3xl p-5 cursor-pointer transition-all flex items-center gap-4 group"
            >
              <div className="text-5xl group-hover:scale-110 transition-transform select-none">✊✌️🖐️</div>
              <div>
                <h3 className="text-lg font-black text-slate-700">Суефа</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Играть с ботом (Удвоение)</p>
              </div>
            </div>
            {/* Coin Flip Card */}
            <div 
              onClick={() => { setActiveGame("coin"); setGameBet(10); setCoinResult(null); }}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-3xl p-5 cursor-pointer transition-all flex items-center gap-4 group"
            >
              <div className="text-5xl group-hover:scale-110 transition-transform select-none">🪙🦅</div>
              <div>
                <h3 className="text-lg font-black text-slate-700">Орел или Решка</h3>
                <p className="text-[10px] font-bold text-slate-400 mt-1">Угадай сторону (Удвоение)</p>
              </div>
            </div>
          </div>
          
          <AnimatePresence>
            {activeGame && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => { setActiveGame(null); setRpsResult(null); setCoinResult(null); }}
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                />
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative w-full max-w-sm bg-white rounded-3xl shadow-xl overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-slate-800">
                        {activeGame === "rps" ? "Суефа" : "Орел или Решка"}
                      </h3>
                      <button onClick={() => { setActiveGame(null); setRpsResult(null); setCoinResult(null); }} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
                    </div>
                    
                    {!rpsResult && !coinResult && !rpsLoading && !coinLoading && (
                      <div className="mb-6">
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Ваша ставка (монет)</label>
                        <input 
                          type="number" 
                          min={1} 
                          max={30}
                          value={gameBet} 
                          onChange={(e) => setGameBet(Math.min(30, Math.max(1, Number(e.target.value) || 1)))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-lg font-black text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    )}
                    
                    {activeGame === "rps" ? (
                      <div>
                        {rpsResult ? (
                          <div className="text-center bg-slate-50 p-6 rounded-3xl border border-slate-200">
                            <div className="flex justify-center items-center gap-4 text-4xl mb-4">
                              <span>{rpsResult.player === "rock" ? "✊" : rpsResult.player === "paper" ? "🖐️" : "✌️"}</span>
                              <span className="text-sm font-bold text-slate-400">VS</span>
                              <span>{rpsResult.bot === "rock" ? "✊" : rpsResult.bot === "paper" ? "🖐️" : "✌️"}</span>
                            </div>
                            <div className={\`text-xl font-black mb-4 \${rpsResult.outcome === "win" ? "text-emerald-500" : rpsResult.outcome === "lose" ? "text-rose-500" : "text-amber-500"}\`}>
                              {rpsResult.outcome === "win" ? \`+\${Math.floor(gameBet * 1.5)} 🪙 ВЫИГРЫШ!\` : rpsResult.outcome === "lose" ? \`-\${gameBet} 🪙 ПРОИГРЫШ\` : "НИЧЬЯ"}
                            </div>
                            <button onClick={() => setRpsResult(null)} className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl cursor-pointer transition-colors">
                              Сыграть еще раз
                            </button>
                          </div>
                        ) : rpsLoading ? (
                          <div className="py-12 flex justify-center"><RefreshCw className="w-12 h-12 animate-spin text-indigo-500" /></div>
                        ) : (
                          <div className="grid grid-cols-3 gap-3">
                            <button onClick={() => handlePlayRps("rock")} className="py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-4xl transition-all cursor-pointer shadow-sm active:scale-95">✊</button>
                            <button onClick={() => handlePlayRps("scissors")} className="py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-4xl transition-all cursor-pointer shadow-sm active:scale-95">✌️</button>
                            <button onClick={() => handlePlayRps("paper")} className="py-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-4xl transition-all cursor-pointer shadow-sm active:scale-95">🖐️</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        {coinResult ? (
                          <div className="text-center bg-slate-50 p-6 rounded-3xl border border-slate-200">
                            <div className="flex justify-center items-center gap-4 text-4xl mb-4">
                              <span className="text-amber-500">{coinResult.bot === "heads" ? "🦅 Орел" : "🪙 Решка"}</span>
                            </div>
                            <div className={\`text-xl font-black mb-4 \${coinResult.outcome === "win" ? "text-emerald-500" : "text-rose-500"}\`}>
                              {coinResult.outcome === "win" ? \`+\${Math.floor(gameBet * 1.5)} 🪙 ВЫИГРЫШ!\` : \`-\${gameBet} 🪙 ПРОИГРЫШ\`}
                            </div>
                            <button onClick={() => setCoinResult(null)} className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl cursor-pointer transition-colors">
                              Сыграть еще раз
                            </button>
                          </div>
                        ) : coinLoading ? (
                          <div className="py-12 flex justify-center"><RefreshCw className="w-12 h-12 animate-spin text-indigo-500" /></div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => handlePlayCoin("heads")} className="py-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all cursor-pointer shadow-sm active:scale-95 flex flex-col items-center gap-2">
                              <span className="text-4xl text-amber-500">🦅</span>
                              <span className="font-bold text-slate-700">Орел</span>
                            </button>
                            <button onClick={() => handlePlayCoin("tails")} className="py-6 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl transition-all cursor-pointer shadow-sm active:scale-95 flex flex-col items-center gap-2">
                              <span className="text-4xl text-amber-500">🪙</span>
                              <span className="font-bold text-slate-700">Решка</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="p-4 sm:p-5 border-b border-slate-100 relative bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 shrink-0">
                  <RotateCcw className="w-4 h-4 text-indigo-500" />
                  История операций (баланс)
                </h3>
                <div className="flex bg-slate-200/50 p-1 rounded-xl mt-3">
                  <button onClick={() => setHistoryFilter("all")} className={\`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black rounded-lg transition-all \${historyFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}\`}>Все</button>
                  <button onClick={() => setHistoryFilter("income")} className={\`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black rounded-lg transition-all \${historyFilter === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}\`}>Зачисления</button>
                  <button onClick={() => setHistoryFilter("expense")} className={\`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black rounded-lg transition-all \${historyFilter === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}\`}>Траты</button>
                </div>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto space-y-3 bg-slate-50 divide-y divide-slate-100">
                {transactions.filter(t => t.kidId === currentUser.id).filter(t => historyFilter === "all" ? true : t.type === historyFilter).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-white rounded-2xl border border-slate-100">
                    История операций пуста. Зарабатывайте монеты на квестах! 💪
                  </div>
                ) : (
                  transactions.filter(t => t.kidId === currentUser.id).filter(t => historyFilter === "all" ? true : t.type === historyFilter).sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()).map((tx) => {
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
                          <div className="text-xs font-bold text-slate-700 truncate">{tx.title || tx.description}</div>
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
}
`;

content += missingCode;
fs.writeFileSync('src/components/KidDashboard.tsx', content);
