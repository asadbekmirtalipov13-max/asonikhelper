import re

with open('src/components/KidDashboard.tsx', 'r') as f:
    content = f.read()

new_logic = """
  const handleActivatePromo = async () => {
    if (!promoCode.trim() || promoLoading) return;
    setPromoLoading(true);
    const code = promoCode.trim().toUpperCase();
    try {
      const q = query(collection(db, "promocodes"), where("code", "==", code), where("active", "==", true));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        // Fallback for HACKER achievement
        if (code === "HACKER") {
          await checkAchievement(currentUser.id, "hacker", 1, settings);
          const newBalance = currentUser.points + 5;
          await updateDoc(doc(db, "users", currentUser.id), { points: newBalance });
          
          const txId = "tx-promo-" + Math.random().toString(36).substr(2, 9);
          await setDoc(doc(db, "transactions", txId), {
            id: txId,
            kidId: currentUser.id,
            kidName: currentUser.name,
            type: "income",
            amount: 5,
            title: "Промокод HACKER",
            createdAt: new Date(),
            balanceAfter: newBalance
          });
          
          fireConfetti();
          showAlert("Успех!", "Промокод активирован! Вы получили 5 монет и открыли достижение Хакер!");
          setPromoCode("");
        } else {
          showAlert("Ошибка", "Неверный или неактивный промокод.");
        }
      } else {
        const promoDoc = snap.docs[0];
        const promo = promoDoc.data();
        
        // Check if user already used this promo
        const txQ = query(collection(db, "transactions"), where("kidId", "==", currentUser.id), where("title", "==", `Промокод ${code}`));
        const txSnap = await getDocs(txQ);
        if (!txSnap.empty) {
           showAlert("Ошибка", "Вы уже активировали этот промокод!");
           setPromoLoading(false);
           return;
        }
        
        if (promo.activationsLeft > 0) {
          const newBalance = currentUser.points + promo.points;
          await updateDoc(doc(db, "users", currentUser.id), { points: newBalance });
          
          const txId = "tx-promo-" + Math.random().toString(36).substr(2, 9);
          await setDoc(doc(db, "transactions", txId), {
            id: txId,
            kidId: currentUser.id,
            kidName: currentUser.name,
            type: "income",
            amount: promo.points,
            title: `Промокод ${code}`,
            createdAt: new Date(),
            balanceAfter: newBalance
          });
          
          const newActivationsLeft = promo.activationsLeft - 1;
          await updateDoc(doc(db, "promocodes", promo.id), {
            activationsLeft: newActivationsLeft,
            active: newActivationsLeft > 0
          });
          
          fireConfetti();
          showAlert("Успех!", `Промокод активирован! Вы получили ${promo.points} монет!`);
          setPromoCode("");
        } else {
          showAlert("Ошибка", "У этого промокода закончились активации.");
        }
      }
    } catch(err) {
      console.error(err);
      showAlert("Ошибка", "Произошла ошибка при активации");
    } finally {
      setPromoLoading(false);
    }
  };
"""

content = re.sub(r'const handleActivatePromo = async \(\) => \{[\s\S]*?\n  \};\n', new_logic, content)

with open('src/components/KidDashboard.tsx', 'w') as f:
    f.write(content)
