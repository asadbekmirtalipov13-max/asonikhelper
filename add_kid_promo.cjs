const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /\{\/\* FAQ Section \*\/\}/;

content = content.replace(regex, `{/* Promo Code Section */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2 mb-4">
                <Ticket className="w-4 h-4 text-rose-500" />
                Ввести промокод
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="PROMOKOD2024"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
                <button
                  onClick={() => showAlert("В разработке", "Промокоды скоро появятся! 🚀")}
                  className={\`px-6 py-3 \${palette.bg} \${palette.hover} text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap\`}
                >
                  Применить
                </button>
              </div>
            </div>

            {/* FAQ Section */}`);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
