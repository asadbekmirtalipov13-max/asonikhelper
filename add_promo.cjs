const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const importRegex = /import \{[\s\S]*?\} from "firebase\/firestore";/;
content = content.replace(importRegex, match => {
  if (!match.includes("getDocs")) match = match.replace('}', ', getDocs, query, where }');
  if (!match.includes("query")) match = match.replace('}', ', query, where }');
  return match;
});

const hookInsert = `
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);

  const handleActivatePromo = async () => {
    if (!promoCode.trim() || promoLoading) return;
    setPromoLoading(true);
    try {
      if (promoCode.trim().toUpperCase() === "HACKER") {
        await checkAchievement(currentUser.id, "hacker", 1, settings);
        
        // Give basic reward
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
    } catch(err) {
      console.error(err);
      showAlert("Ошибка", "Произошла ошибка при активации");
    } finally {
      setPromoLoading(false);
    }
  };
`;

content = content.replace('  // Game Handlers', hookInsert + '\n  // Game Handlers');

const uiRegex = /<input\s*type="text"\s*placeholder="Введите код\.\.\."\s*className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"\s*\/>\s*<button\s*onClick=\{[^}]+\}\s*className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"\s*>\s*Активировать\s*<\/button>/;

const newUi = `<input 
                  type="text" 
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Введите код..." 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                />
                <button 
                  onClick={handleActivatePromo}
                  disabled={promoLoading}
                  className="w-full py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {promoLoading ? "Загрузка..." : "Активировать"}
                </button>`;

content = content.replace(uiRegex, newUi);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
