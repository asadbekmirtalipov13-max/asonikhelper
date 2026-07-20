import re

with open('src/components/KidDashboard.tsx', 'r') as f:
    content = f.read()

old_ach_chest = """      if (ach.reward.chest) {
        setOpeningChest({ day: "ach", isChest: true, points: ach.reward.points || 0, item: null });
      }
      
      fireConfetti();"""

new_ach_chest = """      if (ach.reward.chest) {
        const chestUpdates = { chestsCount: increment(1) };
        await updateDoc(doc(db, "users", currentUser.id), chestUpdates);
        showAlert("Ура!", `Награда за достижение получена!${ach.reward.points ? ` (+${ach.reward.points} монет)` : ""}${ach.reward.chest ? ` (+1 Сундук! Ищите его в магазине)` : ""}`);
      } else {
        showAlert("Ура!", `Награда за достижение получена! (+${ach.reward.points} монет)`);
      }
      
      fireConfetti();"""

content = content.replace(old_ach_chest, new_ach_chest)

with open('src/components/KidDashboard.tsx', 'w') as f:
    f.write(content)
