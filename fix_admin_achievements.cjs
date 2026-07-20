const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

if (!content.includes('import { ACHIEVEMENTS }')) {
  content = content.replace('import { uploadImageToImgbb } from "../utils/upload";', 'import { uploadImageToImgbb } from "../utils/upload";\nimport { ACHIEVEMENTS } from "../achievements";');
}

const placeholderRegex = /<div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">\s*<p className="text-slate-500 font-medium">В разработке\.\.\.<\/p>\s*<\/div>/;

const newAchievementsContent = `
          <div className="space-y-6">
            {users.filter(u => u.role === "kid").map(kid => (
              <div key={kid.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{kid.avatar}</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{kid.name}</h3>
                    <p className="text-xs font-semibold text-indigo-500">{kid.points || 0} монет</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ACHIEVEMENTS.map(ach => {
                    const userAch = (kid.achievements || {})[ach.id];
                    const isCompleted = userAch?.completed || false;
                    return (
                      <div key={ach.id} className={\`p-3 rounded-2xl border flex items-center gap-3 \${isCompleted ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}\`}>
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
                            className={\`mt-1 text-[9px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer \${isCompleted ? 'bg-indigo-200 text-indigo-800 hover:bg-indigo-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}\`}
                          >
                            {isCompleted ? "Забрать" : "Выдать"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {users.filter(u => u.role === "kid").length === 0 && (
              <div className="text-center p-8 text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Сначала добавьте детей в систему.
              </div>
            )}
          </div>
`;

content = content.replace(placeholderRegex, newAchievementsContent);
fs.writeFileSync('src/components/AdminPanel.tsx', content);
