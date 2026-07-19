const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const bellState = `const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);`;
content = content.replace(
  /const \[transferTargetId, setTransferTargetId\] = useState\(""\);/,
  `const [transferTargetId, setTransferTargetId] = useState("");
  ${bellState}`
);

const userNotifications = `const myNotifications = notifications.filter(n => n.kidId === currentUser.id);
  const unreadCount = myNotifications.filter(n => !n.read).length;`;

content = content.replace(
  /const sortedFilteredItems = marketItems/,
  `${userNotifications}\n  const sortedFilteredItems = marketItems`
);

const handleReadNotifications = `
  const handleOpenNotifications = async () => {
    setIsNotificationsOpen(true);
    // Mark unread as read
    const unread = myNotifications.filter(n => !n.read);
    for (const n of unread) {
      await updateDoc(doc(db, "notifications", n.id), { read: true });
    }
  };
  
  const handleOpenChest = async (notification) => {
    if (!notification.chestPoints) return;
    
    // Add points
    const kidRef = doc(db, "users", currentUser.id);
    const newBalance = currentUser.points + notification.chestPoints;
    await updateDoc(kidRef, { points: newBalance });
    
    // Log transaction
    const txId = "tx-chest-" + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, "transactions", txId), {
      id: txId,
      kidId: currentUser.id,
      kidName: currentUser.name,
      type: "income",
      amount: notification.chestPoints,
      title: "Открыт подарочный сундук!",
      createdAt: new Date(),
      balanceAfter: newBalance
    });
    
    // Update notification so it can't be opened again
    await updateDoc(doc(db, "notifications", notification.id), { chestPoints: 0, title: notification.title + " (Открыто)" });
    
    showAlert("ОТКРЫТ СУНДУК! 🎉", \`Вы получили \${notification.chestPoints} монет из сундука!\`);
  };
`;

content = content.replace(
  /const handleTransferCoins = async \(\) => \{/,
  `${handleReadNotifications}\n\n  const handleTransferCoins = async () => {`
);

const bellButton = `
        <button
          onClick={handleOpenNotifications}
          className="bg-white border border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center shadow-md relative hover:bg-slate-50 transition-colors group cursor-pointer"
        >
          <div className="relative">
            <span className="text-3xl group-hover:scale-110 transition-transform block">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-rose-500 text-white font-extrabold text-[10px] w-5 h-5 flex items-center justify-center rounded-full animate-bounce shadow-md">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="text-[10px] font-black text-slate-500 uppercase mt-2">Уведомления</div>
        </button>
`;

content = content.replace(
  /\{\/\* Daily Streak \*\/\}/,
  `${bellButton}\n\n        {/* Daily Streak */}`
);

const notificationsModal = `
      {/* Notifications Modal */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-slate-100 flex flex-col max-h-[85vh]"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  🔔 Ваши уведомления
                </h3>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Закрыть
                </button>
              </div>
              <div className="p-5 overflow-y-auto space-y-3 bg-slate-50">
                {myNotifications.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 text-xs font-bold">
                    У вас пока нет уведомлений.
                  </div>
                ) : (
                  myNotifications.map(n => (
                    <div key={n.id} className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex gap-3 relative">
                      <div className="text-2xl shrink-0">
                        {n.type === "chest" ? "📦" : n.type === "message" ? "💬" : n.type === "quest" ? "📜" : "ℹ️"}
                      </div>
                      <div className="flex-1 space-y-1">
                        <h4 className="font-bold text-slate-800 text-xs">{n.title}</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed whitespace-pre-wrap">{n.text}</p>
                        
                        {n.type === "chest" && n.chestPoints > 0 && (
                          <button
                            onClick={() => handleOpenChest(n)}
                            className="mt-2 w-full py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-[10px] rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3" /> Открыть Сундук!
                          </button>
                        )}
                        
                        <div className="text-[8px] text-slate-300 font-bold mt-1 text-right">
                          {n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString("ru-RU") : "Только что"}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
`;

content = content.replace(
  /\{\/\* Create Chore Modal \*\/\}/,
  `${notificationsModal}\n      {/* Create Chore Modal */}`
);
// wait, KidDashboard doesn't have "Create Chore Modal", it has {/* PURCHASE CONFIRMATION MODAL */}
content = content.replace(
  /\{\/\* PURCHASE CONFIRMATION MODAL \*\/\}/,
  `${notificationsModal}\n      {/* PURCHASE CONFIRMATION MODAL */}`
);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
