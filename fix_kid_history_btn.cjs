const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// The main tabs overflow fix: 
// The tabs container is `<div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">`
// Let's change it to `flex flex-wrap` or `grid grid-cols-2 md:grid-cols-auto`
content = content.replace(/<div className="flex bg-slate-100 p-1\.5 rounded-2xl w-fit">/g, '<div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl w-full">');

// Remove history button from the tabs list
content = content.replace(/<button[\s\S]*?onClick=\{\(\) => setActiveTab\("history"\)\}[\s\S]*?RotateCcw[\s\S]*?История[\s\S]*?<\/button>/, '');

// The old history button in the balance card was:
// <div className="text-[9px] font-black text-amber-100 uppercase tracking-wider">Мой баланс</div>
// <div className="text-xl md:text-3xl font-black mt-0.5 tracking-tight">🪙 {currentUser.points}</div>
// </div>
// </div>
// Let's add the history button there, to open a modal
// <button onClick={() => setIsHistoryModalOpen(true)} className="p-2 bg-black/10 hover:bg-black/20 rounded-xl transition-colors cursor-pointer" title="История операций"><RotateCcw className="w-5 h-5 text-white/90" /></button>

// State for history modal:
// const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
