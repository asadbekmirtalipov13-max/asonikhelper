const fs = require('fs');
let parentDashContent = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

const kidsTabButton = `        <button
          onClick={() => setView("kids")}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative cursor-pointer \${
            view === "kids"
              ? \`\${palette.bg} text-white shadow\`
              : "text-slate-600 hover:text-slate-900"
          }\`}
        >
          <Users className="w-4 h-4" />
          Дети и Достижения
        </button>
      </div>`;

parentDashContent = parentDashContent.replace(/<\/button>\s*<\/div>\s*\{view === "chores"/, kidsTabButton + '\n      {view === "chores"');

const kidsViewCode = `
      {view === "kids" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
              <Users className="w-6 h-6 text-indigo-500" />
              Управление детьми и достижениями
            </h2>
            <div className="space-y-6">
              {kids.map(kid => (
                <div key={kid.id} className="p-4 bg-slate-50 border border-slate-200 rounded-3xl">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl bg-white p-2 rounded-xl border border-slate-100">{kid.avatar}</div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{kid.name}</h3>
                        <p className="text-xs text-slate-500 font-bold">Баланс: {kid.points} 🪙</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Достижения</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ACHIEVEMENTS.map(ach => {
                        const userAch = (kid.achievements || {})[ach.id];
                        const isCompleted = userAch?.completed || false;
                        return (
                          <div key={ach.id} className={\`p-3 rounded-2xl border flex items-center gap-3 \${isCompleted ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}\`}>
                            <div className={\`text-2xl \${!isCompleted && 'opacity-30 grayscale'}\`}>{ach.icon}</div>
                            <div className="flex-1">
                              <h5 className="font-bold text-xs text-slate-700">{ach.title}</h5>
                              <button 
                                onClick={async () => {
                                  try {
                                    const updates = {
                                      [\`achievements.\${ach.id}.completed\`]: !isCompleted,
                                      [\`achievements.\${ach.id}.progress\`]: !isCompleted ? ach.target : 0
                                    };
                                    await updateDoc(doc(db, "users", kid.id), updates);
                                  } catch (e) { console.error(e); }
                                }}
                                className={\`mt-1 text-[9px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer \${isCompleted ? 'bg-amber-200 text-amber-800 hover:bg-amber-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}\`}
                              >
                                {isCompleted ? "Снять" : "Выдать"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
`;

parentDashContent = parentDashContent.replace(/\{view === "chores" &&/, kidsViewCode + '\n      {view === "chores" &&');

if (!parentDashContent.includes('ACHIEVEMENTS')) {
  parentDashContent = parentDashContent.replace(/import \{ checkAchievement \} from "\.\.\/achievements";/, 'import { checkAchievement, ACHIEVEMENTS } from "../achievements";');
}

fs.writeFileSync('src/components/ParentDashboard.tsx', parentDashContent);
