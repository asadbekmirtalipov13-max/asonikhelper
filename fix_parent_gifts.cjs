const fs = require('fs');
let parentDashContent = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

parentDashContent = parentDashContent.replace(
  /<div className="font-bold text-slate-700 text-sm">\{pur\.productTitle\}<\/div>/g,
  `<div className="font-bold text-slate-700 text-sm">
    {pur.productTitle}
    {pur.giftedBy && <span className="ml-2 text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded uppercase">🎁 Подарок от {pur.giftedBy}</span>}
  </div>`
);

fs.writeFileSync('src/components/ParentDashboard.tsx', parentDashContent);
