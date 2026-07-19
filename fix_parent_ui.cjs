const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

const selectRegex = /<select\n\s*value=\{choreExecutionLimit\}\n\s*onChange=\{\(e\) => setChoreExecutionLimit\(Number\(e\.target\.value\)\)\}\n\s*className="w-full mt-1 p-2\.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"\n\s*>/;

content = content.replace(selectRegex, `<select
                  value={choreUrgent ? 25 : choreExecutionLimit}
                  disabled={choreUrgent}
                  onChange={(e) => setChoreExecutionLimit(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                >
                  <option value={25} className={choreUrgent ? "block" : "hidden"}>⏱️ 25 минут (Срочное)</option>`);

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
