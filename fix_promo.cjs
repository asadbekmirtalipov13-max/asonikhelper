const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const regex = /\{\/\* PROMO CODES TAB \*\/\}([\s\S]+?)\{\/\* ACHIEVEMENTS TAB \*\/\}/;
const promoImplementation = `{/* PROMO CODES TAB */}
      {activeTab === "promo" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-indigo-500" />
              Промокоды
            </h2>
            <button
              onClick={() => showAlert("В разработке", "Раздел промокодов еще дорабатывается!")}
              className={\`px-4 py-2 \${palette.bg} text-white text-xs font-bold rounded-xl transition-all hover:opacity-90 flex items-center gap-1.5 cursor-pointer\`}
            >
              <Plus className="w-4 h-4" /> Добавить
            </button>
          </div>
          <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
            <p className="text-slate-500 font-medium text-sm">Здесь будет возможность создавать новые промокоды на монетки. Функция скоро появится в полном объеме.</p>
          </div>
        </div>
      )}
      
      {/* ACHIEVEMENTS TAB */}`;

content = content.replace(regex, promoImplementation);
fs.writeFileSync('src/components/AdminPanel.tsx', content);
