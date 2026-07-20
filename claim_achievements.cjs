const fs = require('fs');
let kidDashContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const claimLogic = `
  const handleClaimAchievement = async (achId: string) => {
    if (loading) return;
    setLoading(true);
    try {
      const ach = ACHIEVEMENTS.find(a => a.id === achId);
      if (!ach) return;
      
      const userAch = (currentUser.achievements || {})[achId];
      if (!userAch || !userAch.completed || userAch.rewardClaimed) return;
      
      let newBalance = currentUser.points;
      if (ach.reward.points) {
        newBalance += ach.reward.points;
      }
      
      const updates = {
        [\`achievements.\${achId}.rewardClaimed\`]: true,
        points: newBalance
      };
      
      await updateDoc(doc(db, "users", currentUser.id), updates);
      
      if (ach.reward.points) {
        const txId = "tx-ach-" + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, "transactions", txId), {
          id: txId,
          kidId: currentUser.id,
          kidName: currentUser.name,
          type: "income",
          amount: ach.reward.points,
          title: \`Награда за достижение: \${ach.title}\`,
          createdAt: new Date(),
          balanceAfter: newBalance
        });
      }
      
      if (ach.reward.chest) {
        // give a random item or points for chest?
        setOpeningChest({ day: "ach", isChest: true, points: ach.reward.points || 0, item: null });
      }
      
      fireConfetti();
      showAlert("Успех!", "Награда за достижение получена!");
    } catch(err) {
      console.error(err);
      showAlert("Ошибка", "Не удалось забрать награду");
    } finally {
      setLoading(false);
    }
  };
`;

if (!kidDashContent.includes('handleClaimAchievement')) {
  kidDashContent = kidDashContent.replace(/const handleBuyItem = async \(\) => \{/, claimLogic + '\n  const handleBuyItem = async () => {');
}

kidDashContent = kidDashContent.replace(/<Check className="w-3 h-3" \/> Выполнено!/, 
  `<Check className="w-3 h-3" /> Выполнено!
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleClaimAchievement(ach.id)}
                          disabled={loading}
                          className="mt-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] rounded-lg shadow-sm transition-all"
                        >
                          Забрать награду!
                        </button>
                      )}`);
                      
kidDashContent = kidDashContent.replace(/\{\!isCompleted \? \(/g, '{!isCompleted ? (');
kidDashContent = kidDashContent.replace(/\} \: \(/, '} : userAch.rewardClaimed ? (');

fs.writeFileSync('src/components/KidDashboard.tsx', kidDashContent);
