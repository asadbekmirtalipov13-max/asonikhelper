const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');

const choreLoopCode = `
      for (const chore of chores) {
        if (chore.status !== "accepted") continue;
        if (!chore.acceptedAt || !chore.executionLimitMinutes) continue;
        
        const acceptedDate = chore.acceptedAt.toDate ? chore.acceptedAt.toDate() : new Date(chore.acceptedAt);
        const deadline = new Date(acceptedDate.getTime() + chore.executionLimitMinutes * 60000);
        const timeRemainingMs = deadline.getTime() - now.getTime();
        
        // Auto fail if expired
        if (timeRemainingMs <= 0) {
          try {
            await updateDoc(doc(db, "chores", chore.id), { status: "declined" });
            
            // Subtract 20 points
            const kidId = chore.assignedTo[0];
            const kid = kids.find(k => k.id === kidId);
            if (kid) {
               const newBalance = kid.points - 20;
               await updateDoc(doc(db, "users", kidId), { points: newBalance });
               
               const txId = "tx-fail-" + Math.random().toString(36).substr(2, 9);
               await setDoc(doc(db, "transactions", txId), {
                 id: txId,
                 kidId: kidId,
                 kidName: kid.name,
                 type: "expense",
                 amount: 20,
                 title: \`Штраф за провал квеста: \${chore.title}\`,
                 description: "Время на выполнение вышло",
                 createdAt: new Date(),
                 balanceAfter: newBalance
               });
            }
          } catch(err) {
            console.error("Failed to auto-fail chore:", err);
          }
          continue;
        }

        if (!chore.isUrgent) continue;
        // Notify if < 5 minutes remaining and not yet notified
        if (timeRemainingMs > 0 && timeRemainingMs <= 5 * 60000 && !chore.urgentNotified) {
`;

appContent = appContent.replace(/for \(const chore of chores\) \{\s*if \(chore.status !== "accepted"\) continue;\s*if \(!chore.isUrgent\) continue;\s*if \(!chore.acceptedAt \|\| !chore.executionLimitMinutes\) continue;\s*const deadline = new Date\(chore.acceptedAt.toDate \? chore.acceptedAt.toDate\(\).getTime\(\) \+ chore.executionLimitMinutes \* 60000 : new Date\(chore.acceptedAt\).getTime\(\) \+ chore.executionLimitMinutes \* 60000\);\s*const timeRemainingMs = deadline.getTime\(\) - now.getTime\(\);\s*\/\/ Notify if < 5 minutes remaining and not yet notified\s*if \(timeRemainingMs > 0 && timeRemainingMs <= 5 \* 60000 && !chore.urgentNotified\) \{/gm, choreLoopCode);

// Fix the dependency array of the useEffect
appContent = appContent.replace(/, \[settings\.telegramChatId, chores\]\);/g, ', [settings.telegramChatId, chores, kids]);');

fs.writeFileSync('src/App.tsx', appContent);
