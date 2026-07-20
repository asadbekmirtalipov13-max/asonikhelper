const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

const regexStatusClass = /chore\.status === "pending" \? "bg-amber-100 text-amber-700" :[\s\S]*?chore\.status === "rejected" \? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"/;
const newStatusClass = \`chore.status === "pending" ? "bg-amber-100 text-amber-700" :
                              chore.status === "rejected" ? "bg-red-100 text-red-600" :
                              chore.status === "declined" ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"\`;

const regexStatusText = /\{chore\.status === "pending" \? "Ожидает" :[\s\S]*?chore\.status === "rejected" \? "Доработка" : "Выполняется"\}/;
const newStatusText = \`{chore.status === "pending" ? "Ожидает" :
                               chore.status === "rejected" ? "Доработка" :
                               chore.status === "declined" ? "Отклонено" : "Выполняется"}\`;

content = content.replace(regexStatusClass, newStatusClass);
content = content.replace(regexStatusText, newStatusText);

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
