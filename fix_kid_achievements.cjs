const fs = require('fs');
let kidDashContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

if (!kidDashContent.includes('checkAchievement')) {
  kidDashContent = kidDashContent.replace(/import \{ doc, updateDoc, setDoc, getDoc, collection, addDoc, increment \} from "firebase\/firestore";/, 'import { doc, updateDoc, setDoc, getDoc, collection, addDoc, increment } from "firebase/firestore";\nimport { checkAchievement } from "../achievements";\nimport { fireConfetti } from "../utils/confetti";');

  const afterTransactionLogic = `
      // Check achievements
      await checkAchievement(currentUser.id, "striker", 1, settings);
      await checkAchievement(currentUser.id, "the_end", 1, settings);
`;
  kidDashContent = kidDashContent.replace(/balanceAfter: newBalance\n\s*\/\/ TODO: achievements here\n\s*\}\);/g, 'balanceAfter: newBalance\n      });\n' + afterTransactionLogic);
  kidDashContent = kidDashContent.replace(/balanceAfter: newBalance\n\s*\}\);/g, 'balanceAfter: newBalance\n      });\n' + afterTransactionLogic);

  // Confetti on daily claim
  kidDashContent = kidDashContent.replace(/setOpeningChest\(\{ day: newStreak, isChest: isChestDay, points: totalEarnedToday, item: wonMarketItem \}\);/g, 
  'fireConfetti();\n      setOpeningChest({ day: newStreak, isChest: isChestDay, points: totalEarnedToday, item: wonMarketItem });');

  // Confetti on market purchase
  kidDashContent = kidDashContent.replace(/showAlert\("Успех", \`Вы успешно купили \$\{item\.title\}\!\`\);/g, 
  'fireConfetti();\n      showAlert("Успех", `Вы успешно купили ${item.title}!`);');

  kidDashContent = kidDashContent.replace(/showAlert\("Поздравляем! 🎉", \`Вы успешно подарили \$\{item\.title\} брату\/сестре \(\$\{targetKid\.name\}\)\!\`\);/g, 
  'fireConfetti();\n      showAlert("Поздравляем! 🎉", `Вы успешно подарили ${item.title} брату/сестре (${targetKid.name})!`);');

  // Promocode hacker achievement
  kidDashContent = kidDashContent.replace(/showAlert\("Успех", \`Промокод активирован! \+\$\{promoData\.points\} монет\.\`\);/g,
  'await checkAchievement(currentUser.id, "hacker", 1, settings);\n        showAlert("Успех", `Промокод активирован! +${promoData.points} монет.`);');

  // Not born for this (cancel task)
  kidDashContent = kidDashContent.replace(/await deleteDoc\(doc\(db, "chores", id\)\);/g,
  'await deleteDoc(doc(db, "chores", id));\n      await checkAchievement(currentUser.id, "not_born", 1, settings);');
  
  // Submit proof confetti
  kidDashContent = kidDashContent.replace(/showAlert\("Успех", "Задание отправлено на проверку!"\);/g,
  'fireConfetti();\n      showAlert("Успех", "Задание отправлено на проверку!");');

  fs.writeFileSync('src/components/KidDashboard.tsx', kidDashContent);
}
