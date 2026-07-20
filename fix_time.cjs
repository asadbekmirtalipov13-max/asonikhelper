const fs = require('fs');
let parentDashContent = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

const oldTimeSelect = `<label className="block text-[10px] font-bold text-slate-400 uppercase">Время на выполнение</label>
                <select
                  value={choreUrgent ? 25 : choreExecutionLimit}
                  disabled={choreUrgent}
                  onChange={(e) => setChoreExecutionLimit(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                >
                  <option value={25} className={choreUrgent ? "block" : "hidden"}>⏱️ 25 минут (Срочное)</option>
                  <option value={15}>⏱️ 15 минут</option>
                  <option value={30}>⏱️ 30 минут</option>
                  <option value={60}>⏱️ 60 минут (1 час)</option>
                  <option value={120}>⏱️ 120 минут (2 часа)</option>
                  <option value={1440}>⏱️ 24 часа</option>
                </select>`;

const newTimeInput = `<label className="block text-[10px] font-bold text-slate-400 uppercase">Время на выполнение (минут)</label>
                <input
                  type="number"
                  min={1}
                  value={choreUrgent ? 25 : choreExecutionLimit}
                  disabled={choreUrgent}
                  onChange={(e) => setChoreExecutionLimit(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />`;

parentDashContent = parentDashContent.replace(oldTimeSelect, newTimeInput);
fs.writeFileSync('src/components/ParentDashboard.tsx', parentDashContent);
