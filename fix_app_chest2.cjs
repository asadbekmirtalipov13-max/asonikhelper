const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /const handleOpenChest = async \([\s\S]*?showAlert\("ОТКРЫТ СУНДУК![^\n]+\n\s*\};\n/;

const replacement = `const [chestIsOpening, setChestIsOpening] = useState(false);

  const handleOpenChest = async (notification: any) => {
    if (!notification.chestPoints || chestIsOpening) return;
    setChestIsOpening(true);
    setOpeningChest(notification);
    
    // Fake animation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      // User requested 1 to 50 coins randomly per chest
      const reward = Math.floor(Math.random() * 50) + 1;
      
      const kidRef = doc(db, "users", currentUser.id);
      const newBalance = currentUser.points + reward;
      await updateDoc(kidRef, { points: newBalance });
      
      const txId = "tx-chest-" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "transactions", txId), {
        id: txId,
        kidId: currentUser.id,
        kidName: currentUser.name,
        type: "income",
        amount: reward,
        description: "Открыт сундук!",
        createdAt: new Date(),
        balanceAfter: newBalance
      });
      await updateDoc(doc(db, "notifications", notification.id), { chestPoints: 0, title: notification.title + " (Открыто)", read: true });
      
      setOpeningChest(null);
      showAlert("ОТКРЫТ СУНДУК! 🎉", \`Вы открыли сундук и нашли там \${reward} монет!\`);
    } finally {
      setChestIsOpening(false);
    }
  };\n`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', content);
