const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const gamesRegex = /\{\/\* GAMES TAB \*\/\}([\s\S]+?)<\/div>\n\s*\)\}/;

const rpsImplementation = `{/* GAMES TAB */}
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
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 relative overflow-hidden">
              <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                ✊✌️🖐️ Суефа
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Ставка 10 монет. Шанс победы 40%. Лимит 100 монет в день.</p>
              
              <button
                onClick={() => showAlert("В разработке", "Игра скоро будет доступна!")}
                className={\`w-full py-3 \${palette.bg} \${palette.hover} text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer\`}
              >
                Играть за 10 🪙
              </button>
            </div>
            
            {/* Coin Flip */}
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 relative overflow-hidden">
              <h3 className="text-lg font-black text-slate-700 flex items-center gap-2">
                🪙 Орел или Решка
              </h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Ставка 10 монет. Угадай сторону монетки. Лимит 50 монет в день.</p>
              
              <button
                onClick={() => showAlert("В разработке", "Игра скоро будет доступна!")}
                className={\`w-full py-3 \${palette.bg} \${palette.hover} text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer\`}
              >
                Играть за 10 🪙
              </button>
            </div>
          </div>
        </div>
      )}`;

content = content.replace(gamesRegex, rpsImplementation);
fs.writeFileSync('src/components/KidDashboard.tsx', content);
