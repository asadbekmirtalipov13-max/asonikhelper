const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// I will extract everything from `{activeTab === "achievements" && (` to `);` before `{activeTab === "games" && (`
const startMarker = '{activeTab === "achievements" && (';
const endMarker = '{activeTab === "games" && (';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex);
  
  const cleanAchievementsTab = `      {activeTab === "achievements" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-500" />
              Мои Достижения
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ACHIEVEMENTS.map(ach => {
              const userAch = (currentUser.achievements || {})[ach.id];
              const isCompleted = userAch?.completed || false;
              const progress = userAch?.progress || 0;
              const percent = Math.min(100, Math.round((progress / ach.target) * 100));
              
              return (
                <div key={ach.id} className={\`p-4 rounded-2xl border \${isCompleted ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-50 border-slate-200'}\`}>
                  <div className="flex gap-4 items-center">
                    <div className={\`text-4xl \${isCompleted ? 'drop-shadow-lg' : 'opacity-50 grayscale'}\`}>
                      {ach.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className={\`font-black text-sm \${isCompleted ? 'text-amber-700' : 'text-slate-600'}\`}>{ach.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium mb-2">{ach.desc}</p>
                      
                      {!isCompleted ? (
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: \`\${percent}%\` }}></div>
                        </div>
                      ) : userAch?.rewardClaimed ? (
                        <div className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Выполнено!
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleClaimAchievement(ach.id)}
                          disabled={loading}
                          className="mt-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          Забрать награду!
                        </button>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      {ach.reward.points && (
                        <div className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md">+{ach.reward.points} 🪙</div>
                      )}
                      {ach.reward.chest && (
                        <div className="text-[10px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-md mt-1">📦 Сундук</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      `;
  
  fs.writeFileSync('src/components/KidDashboard.tsx', before + cleanAchievementsTab + after);
}
