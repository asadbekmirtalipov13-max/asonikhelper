const fs = require('fs');
let parentDashContent = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

const regex = /<label className="block text-\[10px\] font-bold text-slate-400 uppercase">Время на выполнение<\/label>[\s\S]*?<\/select>/;

const newTimeInput = \`<label className="block text-[10px] font-bold text-slate-400 uppercase">Время на выполнение (минут)</label>
                <input
                  type="number"
                  min={1}
                  value={choreUrgent ? 25 : choreExecutionLimit}
                  disabled={choreUrgent}
                  onChange={(e) => setChoreExecutionLimit(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />\`;

parentDashContent = parentDashContent.replace(regex, newTimeInput);
fs.writeFileSync('src/components/ParentDashboard.tsx', parentDashContent);
