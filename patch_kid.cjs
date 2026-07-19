const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(
  /\{chore\.description \|\| "Без описания"\}/g,
  "{chore.isUrgent && <span className=\"bg-rose-500 text-white px-1.5 py-0.5 rounded-md text-[8px] mr-1 uppercase font-black tracking-widest inline-flex items-center gap-0.5\"><Flame className=\"w-2.5 h-2.5\"/>Срочно</span>} {chore.description || 'Без описания'}"
);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
