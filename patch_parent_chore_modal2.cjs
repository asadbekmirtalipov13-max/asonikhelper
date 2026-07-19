const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');
let lines = content.split('\n');

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{view === "chores" && (')) {
    for (let j = i + 1; j < lines.length; j++) {
      if (lines[j].includes('          <div className="xl:col-span-1 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">')) {
        startIndex = j;
      }
      if (lines[j].includes('          {/* Active / Submitted Chores panel */}')) {
        endIndex = j - 2; // the </div> before it
        break;
      }
    }
    break;
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  const formLines = lines.slice(startIndex, endIndex + 1);
  
  // Replace the extracted section with the new top bar
  const newHeader = [
    '          <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm col-span-1 xl:col-span-3">',
    '             <div>',
    '               <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">',
    '                 <Award className="w-4.5 h-4.5 text-indigo-500" />',
    '                 Все выданные задания',
    '               </h3>',
    '             </div>',
    '             <button',
    '               onClick={() => setIsCreateChoreModalOpen(true)}',
    '               className={`px-4 py-3 ${palette.bg} ${palette.hover} text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2`}',
    '             >',
    '               <Plus className="w-4 h-4" /> Добавить задание',
    '             </button>',
    '          </div>'
  ];
  
  lines.splice(startIndex, endIndex - startIndex + 1, ...newHeader);
  
  // Find where to insert the modal
  let reviewDialogIndex = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('{/* FULL SCREEN REVIEW CHORE DIALOG (MODAL) */}')) {
      reviewDialogIndex = i;
      break;
    }
  }
  
  if (reviewDialogIndex !== -1) {
    const modalCode = [
      '      {/* Create Chore Modal */}',
      '      <AnimatePresence>',
      '        {isCreateChoreModalOpen && (',
      '          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">',
      '            <motion.div',
      '              initial={{ opacity: 0, scale: 0.95, y: 20 }}',
      '              animate={{ opacity: 1, scale: 1, y: 0 }}',
      '              exit={{ opacity: 0, scale: 0.95, y: 20 }}',
      '              className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"',
      '            >',
      '              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">',
      '                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">',
      '                  <Sparkles className="w-4.5 h-4.5 text-amber-500" />',
      '                  Раздать новое задание',
      '                </h3>',
      '                <button',
      '                   onClick={() => setIsCreateChoreModalOpen(false)}',
      '                   className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold"',
      '                >',
      '                  Закрыть',
      '                </button>',
      '              </div>',
      '              <div className="p-5 overflow-y-auto">',
      ...formLines,
      '              </div>',
      '            </motion.div>',
      '          </div>',
      '        )}',
      '      </AnimatePresence>'
    ];
    lines.splice(reviewDialogIndex, 0, ...modalCode);
  }
  
  // Add Plus icon import if missing
  let contentFinal = lines.join('\\n');
  contentFinal = contentFinal.replace(
    /setChoreExecutionLimit\(60\);\n\s+setChoreUrgent\(false\);/,
    "setChoreExecutionLimit(60);\n      setChoreUrgent(false);\n      setIsCreateChoreModalOpen(false);"
  );
  fs.writeFileSync('src/components/ParentDashboard.tsx', contentFinal.replace(/\\n/g, '\n'));
  console.log("Success");
} else {
  console.log("Not found");
}
