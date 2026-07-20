import re

with open('src/components/KidDashboard.tsx', 'r') as f:
    content = f.read()

# Add handleOpenChestFromInventory function
chest_logic = """  const handleOpenChestFromInventory = async () => {
    if (loading || !currentUser.chestsCount || currentUser.chestsCount <= 0) return;
    setLoading(true);
    try {
      const reward = Math.floor(Math.random() * (50 - 5 + 1)) + 5; // 5 to 50 coins
      const updates = {
        chestsCount: increment(-1),
        points: increment(reward)
      };
      await updateDoc(doc(db, "users", currentUser.id), updates);
      
      const txId = "tx-chest-" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "transactions", txId), {
        id: txId,
        kidId: currentUser.id,
        kidName: currentUser.name,
        type: "income",
        amount: reward,
        title: `Награда из сундука`,
        createdAt: new Date(),
        balanceAfter: currentUser.points + reward
      });
      
      setOpeningChest({ reward }); // Render chest modal
      fireConfetti();
    } catch(err) {
      console.error(err);
      showAlert("Ошибка", "Не удалось открыть сундук.");
    } finally {
      setLoading(false);
    }
  };"""

content = content.replace("const handleGiftItem = async () => {", chest_logic + "\n\n  const handleGiftItem = async () => {")

# Add Chest UI in Store Tab
store_top_ui = """      {/* STORE REWARDS VIEW */}
      {activeTab === "store" && (
        <div className="space-y-6">"""

new_store_top_ui = """      {/* STORE REWARDS VIEW */}
      {activeTab === "store" && (
        <div className="space-y-6">
          {(currentUser.chestsCount || 0) > 0 && (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              className="bg-purple-100 border-2 border-purple-300 rounded-3xl p-6 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-20 transform translate-x-1/2 -translate-y-1/2">
                <Gift className="w-32 h-32 text-purple-500" />
              </div>
              <Gift className="w-16 h-16 text-purple-600 mb-3 animate-bounce" />
              <h3 className="text-xl font-black text-purple-800 mb-2">У вас есть неоткрытые сундуки! ({currentUser.chestsCount})</h3>
              <p className="text-sm text-purple-600 mb-4 max-w-sm">
                Откройте сундук, чтобы получить случайное количество монет (от 5 до 50 🪙)!
              </p>
              <button
                onClick={handleOpenChestFromInventory}
                disabled={loading}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-black rounded-xl text-lg shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer z-10"
              >
                ОТКРЫТЬ СУНДУК 📦
              </button>
            </motion.div>
          )}"""

content = content.replace(store_top_ui, new_store_top_ui)

# Add Opening Chest Modal at the end
end_modal = """      {/* END OF MAIN DASHBOARD WRAPPER */}
    </div>
  );
}"""

new_end_modal = """
      {/* CHEST MODAL */}
      {openingChest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative"
          >
            <button 
              onClick={() => setOpeningChest(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <motion.div 
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mb-6 flex justify-center"
            >
              <Gift className="w-32 h-32 text-amber-500" />
            </motion.div>
            
            <h2 className="text-2xl font-black text-slate-800 mb-2">УРА! 🎉</h2>
            <p className="text-sm font-bold text-slate-500 mb-6 leading-relaxed">
              Вы открыли сундук и нашли внутри:
            </p>
            
            <div className="bg-amber-100 text-amber-600 rounded-2xl py-6 font-black text-4xl shadow-inner mb-6 border border-amber-200">
              +{openingChest.reward} 🪙
            </div>
            
            <button
              onClick={() => setOpeningChest(null)}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-sm text-lg"
            >
              Отлично!
            </button>
          </motion.div>
        </div>
      )}

      {/* END OF MAIN DASHBOARD WRAPPER */}
    </div>
  );
}"""

content = content.replace(end_modal, new_end_modal)

with open('src/components/KidDashboard.tsx', 'w') as f:
    f.write(content)
