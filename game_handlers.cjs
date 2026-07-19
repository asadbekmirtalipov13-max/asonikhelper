const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const anchor = /\/\/ Helper countdown renderer/;

const handlers = `// Game Handlers
  const handlePlayRps = async (choice: "rock" | "paper" | "scissors") => {
    if (currentUser.points < 10) {
      showAlert("Ой!", "Недостаточно баллов для игры!");
      return;
    }
    
    // Check limit (simplified daily check based on today's txs could be added here, we trust basic for now)
    const todayGameTxs = transactions.filter(t => t.kidId === currentUser.id && t.type === "expense" && t.description?.includes("Игра"));
    const spentToday = todayGameTxs.reduce((sum, t) => sum + t.amount, 0);
    
    if (spentToday >= 100) {
      showAlert("Лимит исчерпан", "Ты уже потратил 100 монет на игры сегодня! Возвращайся завтра.");
      return;
    }

    setRpsLoading(true);
    setRpsChoice(choice);
    
    // 40% win chance logic
    const rand = Math.random();
    let outcome = "lose"; // default
    if (rand < 0.4) {
      outcome = "win";
    } else if (rand < 0.6) {
      outcome = "draw";
    }
    
    let botChoice = "rock";
    if (outcome === "draw") botChoice = choice;
    else if (outcome === "win") {
      if (choice === "rock") botChoice = "scissors";
      if (choice === "paper") botChoice = "rock";
      if (choice === "scissors") botChoice = "paper";
    } else {
      if (choice === "rock") botChoice = "paper";
      if (choice === "paper") botChoice = "scissors";
      if (choice === "scissors") botChoice = "rock";
    }
    
    setTimeout(async () => {
      try {
        const kidRef = doc(db, "users", currentUser.id);
        
        if (outcome === "win") {
          // Bet 10, win 20 -> net +10
          await updateDoc(kidRef, { points: currentUser.points + 10 });
          const txId = "tx-game-" + Math.random().toString(36).substr(2, 9);
          await setDoc(doc(db, "transactions", txId), {
            id: txId, kidId: currentUser.id, kidName: currentUser.name, type: "income", amount: 10, description: \`Выигрыш в Суефа (\${choice})\`, createdAt: new Date(), balanceAfter: currentUser.points + 10
          });
        } else if (outcome === "lose") {
          // Bet 10, lose 10 -> net -10
          await updateDoc(kidRef, { points: currentUser.points - 10 });
          const txId = "tx-game-" + Math.random().toString(36).substr(2, 9);
          await setDoc(doc(db, "transactions", txId), {
            id: txId, kidId: currentUser.id, kidName: currentUser.name, type: "expense", amount: 10, description: \`Проигрыш в Суефа (\${choice})\`, createdAt: new Date(), balanceAfter: currentUser.points - 10
          });
        }
        
        setRpsResult({ player: choice, bot: botChoice, outcome, amount: 10 });
      } catch (e) {
        console.error(e);
      } finally {
        setRpsLoading(false);
      }
    }, 1000);
  };
  
  const handlePlayCoin = async (choice: "heads" | "tails") => {
    if (currentUser.points < 10) {
      showAlert("Ой!", "Недостаточно баллов для игры!");
      return;
    }
    
    const todayGameTxs = transactions.filter(t => t.kidId === currentUser.id && t.type === "expense" && t.description?.includes("Игра"));
    const spentToday = todayGameTxs.reduce((sum, t) => sum + t.amount, 0);
    
    if (spentToday >= 100) { // Using 100 total limit
      showAlert("Лимит исчерпан", "Ты уже потратил лимит на игры сегодня! Возвращайся завтра.");
      return;
    }

    setCoinLoading(true);
    setCoinChoice(choice);
    
    const rand = Math.random();
    let outcome = "lose";
    if (rand < 0.4) outcome = "win"; // 40% win
    
    const botChoice = outcome === "win" ? choice : (choice === "heads" ? "tails" : "heads");
    
    setTimeout(async () => {
      try {
        const kidRef = doc(db, "users", currentUser.id);
        
        if (outcome === "win") {
          await updateDoc(kidRef, { points: currentUser.points + 10 });
          const txId = "tx-game-" + Math.random().toString(36).substr(2, 9);
          await setDoc(doc(db, "transactions", txId), {
            id: txId, kidId: currentUser.id, kidName: currentUser.name, type: "income", amount: 10, description: \`Выигрыш Орел/Решка (\${choice})\`, createdAt: new Date(), balanceAfter: currentUser.points + 10
          });
        } else if (outcome === "lose") {
          await updateDoc(kidRef, { points: currentUser.points - 10 });
          const txId = "tx-game-" + Math.random().toString(36).substr(2, 9);
          await setDoc(doc(db, "transactions", txId), {
            id: txId, kidId: currentUser.id, kidName: currentUser.name, type: "expense", amount: 10, description: \`Проигрыш Орел/Решка (\${choice})\`, createdAt: new Date(), balanceAfter: currentUser.points - 10
          });
        }
        
        setCoinResult({ player: choice, bot: botChoice, outcome, amount: 10 });
      } catch (e) {
        console.error(e);
      } finally {
        setCoinLoading(false);
      }
    }, 1000);
  };

  // Helper countdown renderer`;

content = content.replace(anchor, handlers);
fs.writeFileSync('src/components/KidDashboard.tsx', content);
