const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

const regex = /className="p-4 border border-slate-200 bg-white rounded-2xl flex flex-col justify-between gap-3 shadow-sm relative group"/g;

content = content.replace(regex, 'className={`p-4 border bg-white rounded-2xl flex flex-col justify-between gap-3 shadow-sm relative group ${chore.isUrgent ? "border-rose-400 shadow-rose-100" : "border-slate-200"}`}');

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
