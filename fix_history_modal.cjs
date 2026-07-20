const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /<div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">\n\s*<h3 className="font-bold text-slate-800 text-sm flex items-center gap-1\.5">\n\s*<RotateCcw className="w-4 h-4 text-indigo-500" \/>\n\s*История операций \(баланс\)\n\s*<\/h3>\n\s*<button\n\s*onClick=\{\(\) => setIsHistoryModalOpen\(false\)\}\n\s*className="p-1\.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold cursor-pointer"\n\s*>\n\s*<X className="w-4 h-4" \/>\n\s*<\/button>\n\s*<\/div>\n\s*<div className="p-5 overflow-y-auto space-y-3 bg-slate-50 divide-y divide-slate-100">/;

const replacement = `<div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 gap-3">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 shrink-0">
                  <RotateCcw className="w-4 h-4 text-indigo-500" />
                  История операций (баланс)
                </h3>
                <div className="flex bg-slate-200/50 p-1 rounded-xl">
                  <button onClick={() => setHistoryFilter("all")} className={\`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black rounded-lg transition-all \${historyFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}\`}>Все</button>
                  <button onClick={() => setHistoryFilter("income")} className={\`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black rounded-lg transition-all \${historyFilter === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}\`}>Зачисления</button>
                  <button onClick={() => setHistoryFilter("expense")} className={\`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black rounded-lg transition-all \${historyFilter === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}\`}>Траты</button>
                </div>
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="absolute top-4 sm:top-5 right-4 sm:right-5 p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto space-y-3 bg-slate-50 divide-y divide-slate-100">`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
