const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

content = content.replace(/<label className="block text-\[10px\] font-bold text-slate-400 uppercase">Цена \(баллы 🪙\)<\/label>/, 
'<label className="block text-[10px] font-bold text-slate-400 uppercase flex justify-between">\n                    <span>Цена (баллы 🪙)</span>\n                    {choreUrgent && <span className="text-rose-500 font-black flex gap-1 items-center">🔥 Будет: {chorePoints * 2}</span>}\n                  </label>');

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
