const fs = require('fs');
let kidDashContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// Replace limit
kidDashContent = kidDashContent.replace(/const todayGameTxs = transactions\.filter\(t => t\.kidId === currentUser\.id && t\.type === "expense" && t\.description\?\.includes\("Суефа"\)\);/g, 
  `const todayGameTxs = transactions.filter(t => {
      if (t.kidId !== currentUser.id || t.type !== "expense" || !(t.description?.includes("Суефа") || t.title?.includes("Суефа"))) return false;
      if (!t.createdAt) return false;
      const d = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      return d.toDateString() === new Date().toDateString();
    });`);

kidDashContent = kidDashContent.replace(/const spentToday = todayGameTxs\.reduce\(\(sum, t\) => sum \+ t\.amount, 0\);\n\s*if \(spentToday \+ gameBet > 50\) \{\n\s*showAlert\("Лимит исчерпан", "Максимум 50 монет в день на эту игру! Возвращайся завтра\."\);\n\s*return;\n\s*\}/g,
  `const spentToday = todayGameTxs.reduce((sum, t) => sum + t.amount, 0);
    
    if (spentToday + gameBet > 30) {
      showAlert("Лимит исчерпан", \`Максимум 30 монет в день на эту игру! Осталось \${Math.max(0, 30 - spentToday)} монет.\`);
      return;
    }`);

kidDashContent = kidDashContent.replace(/const todayGameTxs = transactions\.filter\(t => t\.kidId === currentUser\.id && t\.type === "expense" && t\.description\?\.includes\("Орел"\)\);/g, 
  `const todayGameTxs = transactions.filter(t => {
      if (t.kidId !== currentUser.id || t.type !== "expense" || !(t.description?.includes("Орел") || t.title?.includes("Орел"))) return false;
      if (!t.createdAt) return false;
      const d = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
      return d.toDateString() === new Date().toDateString();
    });`);

// Fix text display
kidDashContent = kidDashContent.replace(/<div className="font-extrabold text-slate-700 truncate">\{tx\.title\}<\/div>/g, 
  `<div className="font-extrabold text-slate-700 truncate">{tx.title || tx.description}</div>`);

// Make sure title is saved
kidDashContent = kidDashContent.replace(/description: "Победа в игре \(Суефа\)/g, 'title: "Победа в игре (Суефа)", description: "Победа в игре (Суефа)');
kidDashContent = kidDashContent.replace(/description: "Проигрыш в игре \(Суефа\)/g, 'title: "Проигрыш в игре (Суефа)", description: "Проигрыш в игре (Суефа)');

kidDashContent = kidDashContent.replace(/description: "Победа в игре \(Орел/g, 'title: "Победа в игре (Орел", description: "Победа в игре (Орел');
kidDashContent = kidDashContent.replace(/description: "Проигрыш в игре \(Орел/g, 'title: "Проигрыш в игре (Орел", description: "Проигрыш в игре (Орел');


fs.writeFileSync('src/components/KidDashboard.tsx', kidDashContent);

let parentDashContent = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');
parentDashContent = parentDashContent.replace(/<div className="font-bold text-slate-700">\{tx\.title\}<\/div>/g, 
  `<div className="font-bold text-slate-700">{tx.title || tx.description || 'Транзакция'}</div>`);
fs.writeFileSync('src/components/ParentDashboard.tsx', parentDashContent);

