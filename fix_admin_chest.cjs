const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// Replace state
content = content.replace(/const \[notifChestPoints, setNotifChestPoints\] = useState\(10\);/,
'const [notifChestCount, setNotifChestCount] = useState(1);');

// Replace handleSendNotification
const handlerRegex = /const handleSendNotification = async \([\s\S]+?setNotifText\(""\);\n  \};/;
const newHandler = `const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifText.trim() && notifType !== "chest") return;
    
    setLoading(true);
    try {
      const targets = notifTarget === "all" ? users.filter(u => u.role === "kid") : users.filter(u => u.id === notifTarget);
      if (targets.length === 0) {
         showAlert("Ошибка", "Нет детей для отправки!");
         setLoading(false);
         return;
      }
      
      const batch = writeBatch(db);
      
      for (const kid of targets) {
        if (notifType === "message") {
          const notifRef = doc(collection(db, "notifications"));
          batch.set(notifRef, {
            kidId: kid.id,
            type: "message",
            title: "💬 Сообщение от родителей",
            text: notifText.trim(),
            chestPoints: 0,
            createdAt: new Date(),
            read: false
          });
        } else if (notifType === "chest") {
          for (let i = 0; i < notifChestCount; i++) {
            const notifRef = doc(collection(db, "notifications"));
            const randomCoins = Math.floor(Math.random() * 50) + 1; // 1 to 50
            batch.set(notifRef, {
              kidId: kid.id,
              type: "chest",
              title: "🎁 Вам отправлен СУНДУК!",
              text: "Откройте сундук, чтобы забрать монеты!",
              chestPoints: randomCoins,
              createdAt: new Date(),
              read: false
            });
          }
        }
      }
      
      await batch.commit();
      showAlert("Отправлено! 🚀", \`Успешно отправлено \${targets.length} детям!\`);
      setNotifText("");
    } catch (err) {
      console.error(err);
      showAlert("Ошибка", "Не удалось отправить");
    } finally {
      setLoading(false);
    }
  };`;
content = content.replace(handlerRegex, newHandler);

// Replace the UI part
const uiRegex = /\{notifType === "chest" && \(\n\s*<div>\n\s*<label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Сколько монет в сундуке<\/label>\n\s*<input\n\s*type="number"\n\s*min="1"\n\s*max="1000"\n\s*value=\{notifChestPoints\}\n\s*onChange=\{e => setNotifChestPoints\(Number\(e\.target\.value\)\)\}\n\s*className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"\n\s*\/>\n\s*<p className="text-\[10px\] text-slate-400 mt-1">Ребенок получит уведомление и сможет забрать монеты, нажав на него\.<\/p>\n\s*<\/div>\n\s*\)\}/;
const newUi = `{notifType === "chest" && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Количество сундуков</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={notifChestCount}
                    onChange={e => setNotifChestCount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Ребенок получит указанное количество сундуков (каждый содержит от 1 до 50 случайных монет).</p>
                </div>
              )}`;
content = content.replace(uiRegex, newUi);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
