const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// Add game bet state
content = content.replace(/const \[rpsChoice, setRpsChoice\] = useState<"rock" | "paper" | "scissors" | null>\(null\);/, 
`const [rpsChoice, setRpsChoice] = useState<"rock" | "paper" | "scissors" | null>(null);
  const [activeGame, setActiveGame] = useState<"rps" | "coin" | null>(null);
  const [gameBet, setGameBet] = useState(10);`);

// Replace handlePlayRps
const rpsRegex = /const handlePlayRps = async \([\s\S]+?\}\, 1000\);\n  \};/;
const newRps = `const handlePlayRps = async (choice: "rock" | "paper" | "scissors") => {
    if (currentUser.points < gameBet) {
      showAlert("Ой!", "Недостаточно монет для игры!");
      return;
    }
    
    const todayGameTxs = transactions.filter(t => t.kidId === currentUser.id && t.type === "expense" && t.description?.includes("Суефа"));
    const spentToday = todayGameTxs.reduce((sum, t) => sum + t.amount, 0);
    
    if (spentToday + gameBet > 50) {
      showAlert("Лимит исчерпан", "Максимум 50 монет в день на эту игру! Возвращайся завтра.");
      return;
    }

    setRpsLoading(true);
    setRpsChoice(choice);
    
    setTimeout(async () => {
      const options = ["rock", "paper", "scissors"];
      const botChoice = options[Math.floor(Math.random() * options.length)];
      
      let outcome: "win" | "lose" | "draw" = "draw";
      if (choice === botChoice) outcome = "draw";
      else if (
        (choice === "rock" && botChoice === "scissors") ||
        (choice === "paper" && botChoice === "rock") ||
        (choice === "scissors" && botChoice === "paper")
      ) {
        outcome = "win";
      } else {
        outcome = "lose";
      }
      
      setRpsResult({ player: choice, bot: botChoice, outcome });
      
      try {
        if (outcome === "win") {
          await updateDoc(doc(db, "users", currentUser.id), {
            points: increment(gameBet)
          });
          await addDoc(collection(db, "transactions"), {
            kidId: currentUser.id,
            type: "income",
            amount: gameBet,
            description: "Победа в игре (Суефа)",
            createdAt: new Date(),
            balanceAfter: currentUser.points + gameBet
          });
        } else if (outcome === "lose") {
          await updateDoc(doc(db, "users", currentUser.id), {
            points: increment(-gameBet)
          });
          await addDoc(collection(db, "transactions"), {
            kidId: currentUser.id,
            type: "expense",
            amount: gameBet,
            description: "Проигрыш в игре (Суефа)",
            createdAt: new Date(),
            balanceAfter: currentUser.points - gameBet
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setRpsLoading(false);
      }
    }, 1000);
  };`;
content = content.replace(rpsRegex, newRps);

// Replace handlePlayCoin
const coinRegex = /const handlePlayCoin = async \([\s\S]+?\}\, 1000\);\n  \};/;
const newCoin = `const handlePlayCoin = async (choice: "heads" | "tails") => {
    if (currentUser.points < gameBet) {
      showAlert("Ой!", "Недостаточно монет для игры!");
      return;
    }
    
    const todayGameTxs = transactions.filter(t => t.kidId === currentUser.id && t.type === "expense" && t.description?.includes("Орел"));
    const spentToday = todayGameTxs.reduce((sum, t) => sum + t.amount, 0);
    
    if (spentToday + gameBet > 50) {
      showAlert("Лимит исчерпан", "Максимум 50 монет в день на эту игру! Возвращайся завтра.");
      return;
    }

    setCoinLoading(true);
    setCoinChoice(choice);
    
    setTimeout(async () => {
      const options = ["heads", "tails"];
      const botChoice = options[Math.floor(Math.random() * options.length)];
      
      const outcome: "win" | "lose" = choice === botChoice ? "win" : "lose";
      setCoinResult({ player: choice, result: botChoice as "heads" | "tails", outcome });
      
      try {
        if (outcome === "win") {
          await updateDoc(doc(db, "users", currentUser.id), {
            points: increment(gameBet)
          });
          await addDoc(collection(db, "transactions"), {
            kidId: currentUser.id,
            type: "income",
            amount: gameBet,
            description: "Победа в игре (Орел или Решка)",
            createdAt: new Date(),
            balanceAfter: currentUser.points + gameBet
          });
        } else {
          await updateDoc(doc(db, "users", currentUser.id), {
            points: increment(-gameBet)
          });
          await addDoc(collection(db, "transactions"), {
            kidId: currentUser.id,
            type: "expense",
            amount: gameBet,
            description: "Проигрыш в игре (Орел или Решка)",
            createdAt: new Date(),
            balanceAfter: currentUser.points - gameBet
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCoinLoading(false);
      }
    }, 1000);
  };`;
content = content.replace(coinRegex, newCoin);

// Now for the GAMES UI tab itself
const gamesUiRegex = /\{\/\* GAMES TAB \*\/\}[\s\S]+?\{\/\* History Modal \*\/\}/;
const newGamesUi = `{/* GAMES TAB */}
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
                <p className="text-xs text-slate-500 mt-1">Лимит игр: 50 монет в день.</p>
              </div>
            </div>
            
            {/* Coin Flip Card */}
            <div 
              onClick={() => { setActiveGame("coin"); setGameBet(10); setCoinResult(null); }}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-3xl p-5 cursor-pointer transition-all flex items-center gap-4 group"
            >
              <div className="text-5xl group-hover:scale-110 transition-transform select-none">🪙</div>
              <div>
                <h3 className="text-lg font-black text-slate-700">Орел или Решка</h3>
                <p className="text-xs text-slate-500 mt-1">Лимит игр: 50 монет в день.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Play Modal */}
      <AnimatePresence>
        {activeGame && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl border border-slate-100 flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Gamepad2 className="w-4 h-4 text-indigo-500" />
                  {activeGame === "rps" ? "Суефа" : "Орел или Решка"}
                </h3>
                <button
                  onClick={() => { setActiveGame(null); setRpsResult(null); setCoinResult(null); }}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-6">
                {!rpsResult && !coinResult && !rpsLoading && !coinLoading && (
                  <div className="mb-6">
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Ваша ставка (монет)</label>
                    <input 
                      type="number" 
                      min={1} 
                      max={50}
                      value={gameBet} 
                      onChange={(e) => setGameBet(Math.min(50, Math.max(1, Number(e.target.value) || 1)))}
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
                          {rpsResult.outcome === "win" ? \`+\${gameBet} 🪙 ВЫИГРЫШ!\` : rpsResult.outcome === "lose" ? \`-\${gameBet} 🪙 ПРОИГРЫШ\` : "НИЧЬЯ"}
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
                          {coinResult.outcome === "win" ? \`+\${gameBet} 🪙 ВЫИГРЫШ!\` : \`-\${gameBet} 🪙 ПРОИГРЫШ\`}
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

      {/* History Modal */}`;

content = content.replace(gamesUiRegex, newGamesUi);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
