const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /\{chore\.isUrgent \? \(\n\s*<span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2\.5 py-0\.5 rounded-lg border border-rose-200 flex items-center gap-1 shadow-xs">\n\s*🔥 СРОЧНОЕ \(\+\{chore\.points\}\)\n\s*<\/span>\n\s*\) \: \(\n\s*<span className="font-mono text-xs font-extrabold text-amber-600 bg-amber-50 px-2\.5 py-0\.5 rounded-lg border border-amber-100">\n\s*🪙 \+\{chore\.points\} баллов\n\s*<\/span>\n\s*\)\}\n\s*\{chore\.isUrgent \? \(\n\s*<span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2\.5 py-0\.5 rounded-lg border border-rose-200 flex items-center gap-1 shadow-xs">\n\s*🔥 СРОЧНОЕ \(\+\{chore\.points\}\)\n\s*<\/span>\n\s*\) \: \(\n\s*<span className="font-mono text-xs font-extrabold text-amber-600 bg-amber-50 px-2\.5 py-0\.5 rounded-lg border border-amber-100">\n\s*🪙 \+\{chore\.points\} баллов\n\s*<\/span>\n\s*\)\}/;

const replacement = `{chore.isUrgent ? (
                           <span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1 shadow-xs">
                             🔥 СРОЧНОЕ (+{chore.points})
                           </span>
                        ) : (
                           <span className="font-mono text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                             🪙 +{chore.points} баллов
                           </span>
                        )}`;

content = content.replace(regex, replacement);
fs.writeFileSync('src/components/KidDashboard.tsx', content);
