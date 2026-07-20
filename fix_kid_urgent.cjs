const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const urgentRegex1 = /🔥 СРОЧНОЕ x2 \(\+\{chore\.points\}\)/g;
content = content.replace(urgentRegex1, "🔥 СРОЧНОЕ (+{chore.points})");

const classRegex = /className="p-5 border border-slate-200 bg-white rounded-3xl shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden"/g;
content = content.replace(classRegex, 'className={`p-5 border bg-white rounded-3xl shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden ${chore.isUrgent ? "border-rose-400 shadow-rose-100" : "border-slate-200"}`}');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
