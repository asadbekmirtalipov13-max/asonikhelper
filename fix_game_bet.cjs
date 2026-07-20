const fs = require('fs');
let kidDashContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

kidDashContent = kidDashContent.replace(
  /<label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Ваша ставка \(монет\)<\/label>/g,
  '<label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Ваша ставка (макс 30 монет)</label>'
);

fs.writeFileSync('src/components/KidDashboard.tsx', kidDashContent);
