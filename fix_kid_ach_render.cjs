const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const badCode = `                      ) : (
                        <div className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Выполнено!
                        </div>
                      ) : (`;
const goodCode = `                      ) : userAch?.rewardClaimed ? (
                        <div className="text-[10px] font-black text-emerald-600 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Выполнено!
                        </div>
                      ) : (`;

content = content.replace(badCode, goodCode);
fs.writeFileSync('src/components/KidDashboard.tsx', content);
