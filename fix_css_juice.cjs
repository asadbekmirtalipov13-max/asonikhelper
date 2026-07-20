const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// Add subtle hover animations to store cards
content = content.replace(/className=\{\`rounded-2xl sm:rounded-3xl p-2\.5 sm:p-5 flex flex-col justify-between gap-2\.5 sm:gap-4 transition-all relative overflow-hidden \$\{/g, 
  `className={\`rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 flex flex-col justify-between gap-2.5 sm:gap-4 transition-all duration-300 relative overflow-hidden hover:scale-[1.02] hover:-translate-y-1 \${`);

// Add hover to chore cards
content = content.replace(/className=\{\`relative overflow-hidden bg-white border border-slate-200/g,
  `className={\`relative overflow-hidden bg-white border border-slate-200 transition-all duration-300 hover:scale-[1.01] hover:shadow-md`);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
