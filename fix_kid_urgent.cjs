const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex1 = /<div className="flex justify-between items-center">/;
content = content.replace(regex1, `<div className="flex justify-between items-center">
                        {chore.isUrgent ? (
                           <span className="font-mono text-xs font-black text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200 flex items-center gap-1 shadow-xs">
                             🔥 СРОЧНОЕ x2 (+{chore.points})
                           </span>
                        ) : (
                           <span className="font-mono text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                             🪙 +{chore.points} баллов
                           </span>
                        )}`);

// There are multiple places where chore is rendered: Pending, Accepted, Completed?
// Let's check where else `<div className="flex justify-between items-center">` is used inside Chore mapping
fs.writeFileSync('src/components/KidDashboard.tsx', content);
