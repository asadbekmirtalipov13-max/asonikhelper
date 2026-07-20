const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const oldPromoUI = `<input
                  type="text"
                  placeholder="PROMOKOD2024"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
                <button
                  onClick={() => showAlert("В разработке", "Промокоды скоро появятся! 🚀")}
                  className={\`px-6 py-3 \${palette.bg} \${palette.hover} text-white font-bold rounded-xl transition-all shadow-sm cursor-pointer whitespace-nowrap\`}
                >
                  Применить
                </button>`;

const newPromoUI = `<input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="PROMOKOD2024"
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                />
                <button
                  onClick={handleActivatePromo}
                  disabled={promoLoading}
                  className={\`px-6 py-3 \${palette.bg} \${palette.hover} text-white font-bold rounded-xl transition-all shadow-sm \${promoLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} whitespace-nowrap\`}
                >
                  {promoLoading ? 'Загрузка...' : 'Применить'}
                </button>`;

content = content.replace(oldPromoUI, newPromoUI);
fs.writeFileSync('src/components/KidDashboard.tsx', content);
