const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const cronCode = `
  // Telegram Urgent notifications cron
  useEffect(() => {
    if (!settings.telegramChatId || chores.length === 0) return;
    
    const interval = setInterval(async () => {
      const now = new Date();
      for (const chore of chores) {
        if (chore.status !== "accepted") continue;
        if (!chore.isUrgent) continue;
        if (!chore.acceptedAt || !chore.executionLimitMinutes) continue;
        
        const deadline = new Date(chore.acceptedAt.toDate ? chore.acceptedAt.toDate().getTime() + chore.executionLimitMinutes * 60000 : new Date(chore.acceptedAt).getTime() + chore.executionLimitMinutes * 60000);
        
        const timeRemainingMs = deadline.getTime() - now.getTime();
        
        // Notify if < 5 minutes remaining and not yet notified
        if (timeRemainingMs > 0 && timeRemainingMs <= 5 * 60000 && !chore.urgentNotified) {
          // Send notification
          try {
            await sendTelegramNotification(
              \`⚠️ <b>ВНИМАНИЕ! СРОЧНОЕ ЗАДАНИЕ!</b>\\nКвест <b>\${chore.title}</b> скоро провалится!\\nОсталось менее 5 минут!\\nПоторопитесь!\`,
              settings.telegramChatId
            );
            // mark notified
            await updateDoc(doc(db, "chores", chore.id), { urgentNotified: true });
          } catch(err) {
            console.error("Failed to send urgent warning:", err);
          }
        }
      }
    }, 60000); // check every minute
    
    return () => clearInterval(interval);
  }, [chores, settings.telegramChatId]);
`;

content = content.replace(
  /return \(\n\s+<div/,
  cronCode + '\n  return (\n    <div'
);

fs.writeFileSync('src/App.tsx', content);
