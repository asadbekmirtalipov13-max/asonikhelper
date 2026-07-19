const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

// Find the Active Chores section
content = content.replace(
  /Активные задания в процессе \(\{chores\.filter\(c => c\.status === "accepted" \|\| c\.status === "pending" \|\| c\.status === "rejected"\)\.length\}\)/,
  `Активные и Отмененные задания ({chores.filter(c => c.status === "accepted" || c.status === "pending" || c.status === "rejected" || c.status === "declined").length})`
);
content = content.replace(
  /chores\.filter\(c => c\.status === "accepted" \|\| c\.status === "pending" \|\| c\.status === "rejected"\)\.length === 0/,
  `chores.filter(c => c.status === "accepted" || c.status === "pending" || c.status === "rejected" || c.status === "declined").length === 0`
);
content = content.replace(
  /chores\.filter\(c => c\.status === "accepted" \|\| c\.status === "pending" \|\| c\.status === "rejected"\)\.map/,
  `chores.filter(c => c.status === "accepted" || c.status === "pending" || c.status === "rejected" || c.status === "declined").map`
);

// Add styling for declined chores
content = content.replace(
  /className=\{"bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden"\}\n\s+key=\{chore\.id\}/,
  `key={chore.id}
                        className={\`bg-white border rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden \${chore.status === "declined" ? "border-rose-300 bg-rose-50/30" : "border-slate-200"}\`}`
);

// We should also show a badge for declined
const declinedBadge = `
                        {chore.status === "declined" && (
                          <div className="absolute top-3 right-3 bg-rose-100 text-rose-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 border border-rose-200">
                            ❌ Ребенок отменил квест
                          </div>
                        )}
                        <div className="absolute top-3 right-3 bg-slate-100 text-slate-500`;
content = content.replace(
  /<div className="absolute top-3 right-3 bg-slate-100 text-slate-500/,
  declinedBadge
);

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
