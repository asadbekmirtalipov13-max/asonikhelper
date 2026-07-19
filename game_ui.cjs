const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const gamesRegex = /\{\/\* GAMES TAB \*\/\}([\s\S]+?)<\/div>\n\s*\)\}/;

const gamesImpl = `{/* GAMES TAB */}
      {activeTab === "games" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-indigo-500" />
              Игры
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Rock Paper Scissors */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                  ✊✌️🖐️ Суефа
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Ставка 10 монет. Шанс победы 40%. Лимит 100 монет в день.</p>
              </div>
              
              {rpsResult ? (
                <div className="text-center bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="flex justify-center items-center gap-4 text-3xl mb-2">
                    <span>{rpsResult.player === "rock" ? "✊" : rpsResult.player === "paper" ? "🖐️" : "✌️"}</span>
                    <span className="text-sm font-bold text-slate-400">VS</span>
                    <span>{rpsResult.bot === "rock" ? "✊" : rpsResult.bot === "paper" ? "🖐️" : "✌️"}</span>
                  </div>
                  <div className={\`text-lg font-black \${rpsResult.outcome === "win" ? "text-emerald-500" : rpsResult.outcome === "lose" ? "text-rose-500" : "text-amber-500"}\`}>
                    {rpsResult.outcome === "win" ? "+10 🪙 ВЫИГРЫШ!" : rpsResult.outcome === "lose" ? "-10 🪙 ПРОИГРЫШ" : "НИЧЬЯ"}
                  </div>
                  <button onClick={() => setRpsResult(null)} className="mt-3 text-xs font-bold text-indigo-500 hover:text-indigo-600 cursor-pointer">
                    Сыграть еще раз
                  </button>
                </div>
              ) : rpsLoading ? (
                <div className="py-6 flex justify-center"><RefreshCw className="w-8 h-8 animate-spin text-indigo-500" /></div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handlePlayRps("rock")} className="py-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-2xl transition-all cursor-pointer shadow-sm">✊</button>
                  <button onClick={() => handlePlayRps("scissors")} className="py-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-2xl transition-all cursor-pointer shadow-sm">✌️</button>
                  <button onClick={() => handlePlayRps("paper")} className="py-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-2xl transition-all cursor-pointer shadow-sm">🖐️</button>
                </div>
              )}
            </div>
            
            {/* Coin Flip */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                  🪙 Орел или Решка
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-4">Ставка 10 монет. Угадай сторону. Шанс победы 40%.</p>
              </div>
              
              {coinResult ? (
                <div className="text-center bg-white p-4 rounded-2xl border border-slate-200">
                  <div className="text-4xl mb-2">
                    {coinResult.bot === "heads" ? "🦅" : "🪙"}
                  </div>
                  <div className={\`text-lg font-black \${coinResult.outcome === "win" ? "text-emerald-500" : "text-rose-500"}\`}>
                    {coinResult.outcome === "win" ? "+10 🪙 ВЫИГРЫШ!" : "-10 🪙 ПРОИГРЫШ"}
                  </div>
                  <button onClick={() => setCoinResult(null)} className="mt-3 text-xs font-bold text-indigo-500 hover:text-indigo-600 cursor-pointer">
                    Сыграть еще раз
                  </button>
                </div>
              ) : coinLoading ? (
                <div className="py-6 flex justify-center"><RefreshCw className="w-8 h-8 animate-spin text-indigo-500" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handlePlayCoin("heads")} className="py-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-lg font-bold transition-all cursor-pointer shadow-sm">🦅 Орел</button>
                  <button onClick={() => handlePlayCoin("tails")} className="py-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-lg font-bold transition-all cursor-pointer shadow-sm">🪙 Решка</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}`;

content = content.replace(gamesRegex, gamesImpl);
fs.writeFileSync('src/components/KidDashboard.tsx', content);
