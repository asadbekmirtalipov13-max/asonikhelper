const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// Add state
content = content.replace(/const \[searchTerm, setSearchTerm\] = useState\(""\);/, `const [searchTerm, setSearchTerm] = useState("");\n  const [historyFilter, setHistoryFilter] = useState<"all" | "income" | "expense">("all");`);

// Modify activeTab === "history"
const historyRegex = /<h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1\.5">\n\s*📈 История операций \(баланс\)\n\s*<\/h4>\n\s*<div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50">/;

const historyReplacement = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  📈 История операций (баланс)
                </h4>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button onClick={() => setHistoryFilter("all")} className={\`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black rounded-lg transition-all \${historyFilter === "all" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}\`}>Все</button>
                  <button onClick={() => setHistoryFilter("income")} className={\`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black rounded-lg transition-all \${historyFilter === "income" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}\`}>Зачисления</button>
                  <button onClick={() => setHistoryFilter("expense")} className={\`flex-1 sm:flex-none px-3 py-1.5 text-[10px] font-black rounded-lg transition-all \${historyFilter === "expense" ? "bg-white text-rose-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}\`}>Траты</button>
                </div>
              </div>
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50">`;

content = content.replace(historyRegex, historyReplacement);

// Update filter logic
content = content.replace(/transactions\.filter\(t => t\.kidId === currentUser\.id\)\.map/g, `transactions.filter(t => t.kidId === currentUser.id).filter(t => historyFilter === "all" ? true : t.type === historyFilter).map`);
content = content.replace(/transactions\.filter\(t => t\.kidId === currentUser\.id\)\.sort/g, `transactions.filter(t => t.kidId === currentUser.id).filter(t => historyFilter === "all" ? true : t.type === historyFilter).sort`);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
