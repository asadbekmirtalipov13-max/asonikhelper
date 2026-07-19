const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const errRegex = /\{chore\.isUrgent \? \(\n\s*<span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2\.5 py-0\.5 rounded-lg border border-rose-200 flex items-center gap-1 shadow-xs">\n\s*🔥 СРОЧНОЕ x2 \(\+\{chore\.points\}\)\n\s*<\/span>\n\s*\) : \(\n\s*\{chore\.isUrgent \? \(\n\s*<span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2\.5 py-0\.5 rounded-lg border border-rose-200 flex items-center gap-1 shadow-xs">\n\s*🔥 СРОЧНОЕ x2 \(\+\{chore\.points\}\)\n\s*<\/span>\n\s*\) : \(\n\s*<span className="font-mono text-xs font-extrabold text-amber-600 bg-amber-50 px-2\.5 py-0\.5 rounded-lg border border-amber-100">\n\s*🪙 \+\{chore\.points\} баллов\n\s*<\/span>\n\s*\)\}\n\s*\)\}/;

content = content.replace(errRegex, `{chore.isUrgent ? (
                           <span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1 shadow-xs">
                             🔥 СРОЧНОЕ x2 (+{chore.points})
                           </span>
                        ) : (
                           <span className="font-mono text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                             🪙 +{chore.points} баллов
                           </span>
                        )}`);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
