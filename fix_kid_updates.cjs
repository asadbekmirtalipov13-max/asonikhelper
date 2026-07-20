const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// Add state for update modal
const stateRegex = /const \[transferTargetId, setTransferTargetId\] = useState\(""\);/;
const stateReplacement = `const [transferTargetId, setTransferTargetId] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState<{title: string, text: string, version: number} | null>(null);
  const [hasScrolledUpdate, setHasScrolledUpdate] = useState(false);

  useEffect(() => {
    if (settings.latestUpdate && settings.latestUpdate.version) {
      if (!currentUser.lastSeenUpdate || currentUser.lastSeenUpdate < settings.latestUpdate.version) {
        setShowUpdateModal(settings.latestUpdate);
      }
    }
  }, [settings.latestUpdate, currentUser.lastSeenUpdate]);

  const handleCloseUpdate = async () => {
    if (!hasScrolledUpdate) return;
    setShowUpdateModal(null);
    try {
      await updateDoc(doc(db, "users", currentUser.id), {
        lastSeenUpdate: settings.latestUpdate.version
      });
    } catch(err) {}
  };
`;
content = content.replace(stateRegex, stateReplacement);

// Add Update Modal UI
const modalRegex = /\{\/\* GIFT CONFIRMATION MODAL \*\/\}/;
const modalReplacement = `{/* SYSTEM UPDATE MODAL */}
      <AnimatePresence>
        {showUpdateModal && (
          <div className="fixed inset-0 bg-indigo-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col"
              style={{ maxHeight: '85vh' }}
            >
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 sm:p-8 text-center text-white relative shrink-0">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                  <div className="absolute w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-3xl -top-10 -left-10 animate-pulse"></div>
                  <div className="absolute w-40 h-40 bg-purple-300 rounded-full mix-blend-overlay filter blur-3xl bottom-0 right-0 animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>
                <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-indigo-100" />
                <h2 className="text-2xl sm:text-3xl font-black mb-2 relative z-10 tracking-tight">Обновление Системы!</h2>
                <h3 className="text-indigo-100 font-bold text-sm sm:text-base relative z-10">{showUpdateModal.title}</h3>
              </div>
              
              <div 
                className="p-6 sm:p-8 overflow-y-auto grow text-slate-600 leading-relaxed space-y-4"
                onScroll={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.scrollHeight - target.scrollTop <= target.clientHeight + 20) {
                    setHasScrolledUpdate(true);
                  }
                }}
              >
                <div className="prose prose-sm sm:prose-base max-w-none text-slate-600 whitespace-pre-wrap font-medium">
                  {showUpdateModal.text}
                </div>
                
                <div className="mt-8 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                  <p className="text-xs font-bold text-indigo-400">
                    {!hasScrolledUpdate ? "↓ Пролистайте до конца, чтобы продолжить ↓" : "✅ Вы ознакомились с обновлением!"}
                  </p>
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 shrink-0">
                <button
                  onClick={handleCloseUpdate}
                  disabled={!hasScrolledUpdate}
                  className={\`w-full py-4 text-white font-black rounded-2xl text-sm sm:text-base transition-all shadow-lg flex items-center justify-center gap-2 \${
                    hasScrolledUpdate 
                      ? "bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-200 hover:-translate-y-0.5 cursor-pointer" 
                      : "bg-slate-300 cursor-not-allowed opacity-70"
                  }\`}
                >
                  {hasScrolledUpdate ? "Понятно, круто! 🚀" : "Прочитайте обновления"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GIFT CONFIRMATION MODAL */}`;
content = content.replace(modalRegex, modalReplacement);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
