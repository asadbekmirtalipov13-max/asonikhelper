const fs = require('fs');
let parentDashContent = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

if (!parentDashContent.includes('checkAchievement')) {
  parentDashContent = parentDashContent.replace(/import \{ collection, addDoc, updateDoc, doc, setDoc, deleteDoc \} from "firebase\/firestore";/, 'import { collection, addDoc, updateDoc, doc, setDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";\nimport { checkAchievement } from "../achievements";');
  
  const achievementsLogic = `
      // Check achievements
      await checkAchievement(kidId, "first_steps", 1, settings);
      await checkAchievement(kidId, "stalker", 1, settings);
      
      if (chore.acceptedAt && chore.completedAt) {
        const acceptedDate = chore.acceptedAt.toDate ? chore.acceptedAt.toDate() : new Date(chore.acceptedAt);
        const completedDate = chore.completedAt.toDate ? chore.completedAt.toDate() : new Date(chore.completedAt);
        const diffMs = completedDate.getTime() - acceptedDate.getTime();
        if (diffMs <= 5 * 60 * 1000) {
          await checkAchievement(kidId, "easy_peasy", 1, settings);
        }
      }
      
      try {
        const todayStart = new Date();
        todayStart.setHours(0,0,0,0);
        const choresRef = collection(db, "chores");
        const q = query(choresRef, where("assignedTo", "array-contains", kidId), where("status", "==", "approved"));
        const snap = await getDocs(q);
        let todayCount = 0;
        snap.forEach(doc => {
          const c = doc.data();
          if (c.completedAt) {
            const cDate = c.completedAt.toDate ? c.completedAt.toDate() : new Date(c.completedAt);
            if (cDate >= todayStart) todayCount++;
          }
        });
        if (todayCount >= 3) {
          await checkAchievement(kidId, "colonist", 3, settings);
        }
      } catch (e) { console.error(e); }
`;
  parentDashContent = parentDashContent.replace(/\/\/ Send direct Telegram notification to Kid/g, achievementsLogic + '\n      // Send direct Telegram notification to Kid');
  
  fs.writeFileSync('src/components/ParentDashboard.tsx', parentDashContent);
}
