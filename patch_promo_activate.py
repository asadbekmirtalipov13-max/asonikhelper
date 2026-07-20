import re

with open('src/components/KidDashboard.tsx', 'r') as f:
    content = f.read()

old_func_regex = r'const handleActivatePromo = async \(\) => \{[\s\S]*?finally \{\s*setPromoLoading\(false\);\s*\}\s*\};\s*'

new_func = """  const handleActivatePromo = async () => {
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
        
        const usedBy = promo.usedBy || [];
        if (usedBy.includes(currentUser.id)) {
           showAlert("Ошибка", "Вы уже активировали этот промокод!");
           setPromoLoading(false);
           return;
        }
        
        if (promo.activationsLeft > 0) {
          let newBalance = currentUser.points;
          let msg = "Промокод активирован!";
          
          if (promo.points > 0) {
            newBalance += promo.points;
            msg += ` Вы получили ${promo.points} монет!`;
            
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
          }
          
          if (promo.chest) {
             const updates = {
               chestsCount: increment(1)
             };
             await updateDoc(doc(db, "users", currentUser.id), updates);
             msg += " Вы получили сундук!";
          }
          
          if (promo.productId) {
            const marketRef = doc(db, "market", promo.productId);
            const marketSnap = await getDoc(marketRef);
            if (marketSnap.exists()) {
              const item = marketSnap.data();
              const purchaseId = "buy-" + Math.random().toString(36).substr(2, 9);
              await setDoc(doc(db, "purchases", purchaseId), {
                id: purchaseId,
                kidId: currentUser.id,
                kidName: currentUser.name,
                productId: item.id,
                productTitle: item.title,
                price: 0,
                status: "pending",
                createdAt: new Date()
              });
              msg += ` Вы получили товар "${item.title}"! (Ожидает подтверждения)`;
            }
          }
          
          if (newBalance !== currentUser.points) {
            await updateDoc(doc(db, "users", currentUser.id), { points: newBalance });
          }
          
          const newActivationsLeft = promo.activationsLeft - 1;
          await updateDoc(doc(db, "promocodes", promo.id), {
            activationsLeft: newActivationsLeft,
            active: newActivationsLeft > 0,
            usedBy: [...usedBy, currentUser.id]
          });
          
          fireConfetti();
          showAlert("Успех!", msg);
          setPromoCode("");
          await checkAchievement(currentUser.id, "hacker", 1, settings);
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

content = re.sub(old_func_regex, new_func, content)

with open('src/components/KidDashboard.tsx', 'w') as f:
    f.write(content)
