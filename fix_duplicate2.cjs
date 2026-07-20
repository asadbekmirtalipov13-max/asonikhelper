const fs = require('fs');
let kidDashContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

let startIndex;
while ((startIndex = kidDashContent.indexOf('const handleClaimAchievement = async (achId: string) => {')) !== -1) {
  let braceCount = 1;
  let i = startIndex + 'const handleClaimAchievement = async (achId: string) => {'.length;
  while (braceCount > 0 && i < kidDashContent.length) {
    if (kidDashContent[i] === '{') braceCount++;
    if (kidDashContent[i] === '}') braceCount--;
    i++;
  }
  // Also remove the newline and semicolon
  while (kidDashContent[i] === ';' || kidDashContent[i] === '\\n' || kidDashContent[i] === ' ') i++;
  
  kidDashContent = kidDashContent.substring(0, startIndex) + kidDashContent.substring(i);
}

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

kidDashContent = kidDashContent.replace('const handleBuyItem = async () => {', claimLogic + '\\n  const handleBuyItem = async () => {');

fs.writeFileSync('src/components/KidDashboard.tsx', kidDashContent);
