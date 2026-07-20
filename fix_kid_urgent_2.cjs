const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /className=\{\`p-5 border rounded-3xl bg-white shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden \$\{\n\s*chore\.status === "rejected" \? "border-red-200 bg-rose-50\/10" \: "border-slate-200"\n\s*\}\`\}\n\s*>\n\s*<div className="space-y-1\.5">\n\s*<div className="flex justify-between items-center">\n\s*<span className="font-mono text-xs font-extrabold text-amber-600 bg-amber-50 px-2\.5 py-0\.5 rounded-lg border border-amber-100">\n\s*🪙 \+\{chore\.points\} монет\n\s*<\/span>/;

const replacement = `className={\`p-5 border rounded-3xl bg-white shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden \${
                      chore.status === "rejected" ? "border-red-400 bg-rose-50/20" : chore.isUrgent ? "border-rose-400 shadow-rose-100" : "border-slate-200"
                    }\`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        {chore.isUrgent ? (
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
