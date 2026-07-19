const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

const regexChores = /\{view === "chores" && \(\s*<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">\s*\{\/\* New Chore creator \*\/\}\s*<div className="xl:col-span-1 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">([\s\S]*?)<\/form>\s*<\/div>\s*\{\/\* Pending Chores \*\//;

const match = content.match(regexChores);
if (match) {
  const formContent = match[1];

  const replacement = `{view === "chores" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
             <div>
               <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                 <Award className="w-4.5 h-4.5 text-indigo-500" />
                 Все выданные задания
               </h3>
               <p className="text-[10px] text-slate-400 mt-1">Здесь вы можете видеть статус заданий и принимать работу</p>
             </div>
             <button
               onClick={() => setIsCreateChoreModalOpen(true)}
               className={\`px-4 py-3 \${palette.bg} \${palette.hover} text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2\`}
             >
               <Plus className="w-4 h-4" /> Добавить задание
             </button>
          </div>
          
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Pending Chores */`;
  
  content = content.replace(regexChores, replacement);
  
  // Now add the modal at the bottom before AnimatePresence of reviewChore
  const modalCode = `
      {/* Create Chore Modal */}
      <AnimatePresence>
        {isCreateChoreModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                  Раздать новое задание
                </h3>
                <button 
                   onClick={() => setIsCreateChoreModalOpen(false)}
                   className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold"
                >
                  Закрыть
                </button>
              </div>
              <div className="p-5 overflow-y-auto">
                <div className="space-y-4">
                  ${formContent}
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;
  
  content = content.replace(/\{\/\* FULL SCREEN REVIEW CHORE DIALOG \(MODAL\) \*\/\}/, modalCode + "\n      {/* FULL SCREEN REVIEW CHORE DIALOG (MODAL) */}");
  
  // also fix handleCreateChore to close modal
  content = content.replace(/setChoreExecutionLimit\(60\);\n\s+setChoreUrgent\(false\);/, "setChoreExecutionLimit(60);\n      setChoreUrgent(false);\n      setIsCreateChoreModalOpen(false);");
  
  fs.writeFileSync('src/components/ParentDashboard.tsx', content);
  console.log("Success");
} else {
  console.log("Failed to match regex");
}
