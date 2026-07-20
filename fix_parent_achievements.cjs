const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

const approveLogic = `
      // Log transaction
      const txId = "tx-chore-appr-" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "transactions", txId), {
        id: txId,
        kidId: kidId,
        kidName: kid.name,
        type: "income",
        amount: pointsToAward,
        title: \`Выполнение квеста: \${chore.title}\`,
        createdAt: new Date(),
        balanceAfter: newBalance
      });

      // Check achievements
      try {
        await checkAchievement(kidId, "first_steps", 1, settings);
        await checkAchievement(kidId, "colonist", 1, settings);
        await checkAchievement(kidId, "stalker", 1, settings);
        
        if (chore.createdAt && chore.completedAt) {
          const createTime = chore.createdAt.toDate ? chore.createdAt.toDate().getTime() : new Date(chore.createdAt).getTime();
          const completeTime = chore.completedAt.toDate ? chore.completedAt.toDate().getTime() : new Date(chore.completedAt).getTime();
          if (completeTime - createTime <= 5 * 60 * 1000) {
            await checkAchievement(kidId, "easy_peasy", 1, settings);
          }
        }
      } catch(e) { console.error("Ach err", e); }
`;

content = content.replace(
/      \/\/ Log transaction\s+const txId = "tx-chore-appr-"[\s\S]*?balanceAfter: newBalance\s+\}\);/,
approveLogic
);

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
