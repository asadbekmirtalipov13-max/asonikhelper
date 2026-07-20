const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /const handleActivatePromo = async \(\) => \{[\s\S]*?finally \{\s*setPromoLoading\(false\);\s*\}\s*\};/;

const newPromoFunc = `const handleActivatePromo = async () => {
    if (!promoCode.trim() || promoLoading) return;
    setPromoLoading(true);
    const finalCode = promoCode.trim().toUpperCase();
    try {
      if (finalCode === "HACKER") {
        await checkAchievement(currentUser.id, "hacker", 1, settings);
        const newBalance = currentUser.points + 5;
        await updateDoc(doc(db, "users", currentUser.id), { points: newBalance });
        const txId = "tx-promo-" + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, "transactions", txId), {
          id: txId, kidId: currentUser.id, kidName: currentUser.name, type: "income",
          amount: 5, title: "Промокод HACKER", createdAt: new Date(), balanceAfter: newBalance
        });
        fireConfetti();
        showAlert("Успех!", "Промокод активирован! Вы получили 5 монет и открыли достижение Хакер!");
        setPromoCode("");
      } else {
        // Query database for promo code
        const promoRef = doc(db, "promocodes", finalCode);
        const promoSnap = await getDoc(promoRef);
        
        if (!promoSnap.exists()) {
          showAlert("Ошибка", "Неверный промокод.");
          return;
        }
        
        const promoData = promoSnap.data();
        const usedBy = promoData.usedBy || [];
        
        if (usedBy.includes(currentUser.id)) {
          showAlert("Ошибка", "Вы уже использовали этот промокод!");
          return;
        }
        
        // Apply promo
        const amount = promoData.amount || 0;
        const newBalance = currentUser.points + amount;
        
        await updateDoc(doc(db, "users", currentUser.id), { points: newBalance });
        await updateDoc(promoRef, { usedBy: [...usedBy, currentUser.id] });
        
        const txId = "tx-promo-" + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, "transactions", txId), {
          id: txId, kidId: currentUser.id, kidName: currentUser.name, type: "income",
          amount: amount, title: "Активация промокода " + finalCode, createdAt: new Date(), balanceAfter: newBalance
        });
        
        await checkAchievement(currentUser.id, "hacker", 1, settings);
        
        fireConfetti();
        showAlert("Успех!", \`Промокод активирован! Вы получили \${amount} монет!\`);
        setPromoCode("");
      }
    } catch(err) {
      console.error(err);
      showAlert("Ошибка", "Произошла ошибка при активации");
    } finally {
      setPromoLoading(false);
    }
  };`;

content = content.replace(regex, newPromoFunc);
fs.writeFileSync('src/components/KidDashboard.tsx', content);
