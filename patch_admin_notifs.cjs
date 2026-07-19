const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  /const \[activeTab, setActiveTab\] = useState<"users" \| "telegram" \| "branding" \| "system">/,
  `const [activeTab, setActiveTab] = useState<"users" | "telegram" | "branding" | "system" | "notifications" | "faq" | "categories">`
);

content = content.replace(
  /import \{([\s\S]+?)Bell([\s\S]+?)\} from "lucide-react";/,
  `import {$1Bell$2} from "lucide-react";`
);
if (!content.includes('Bell,') && !content.includes(', Bell')) {
  content = content.replace(
    /Trash2, RefreshCw,/,
    `Trash2, RefreshCw, Bell, Sparkles, HelpCircle,`
  );
}

// Add state for notifications
const notifState = `
  const [notifTarget, setNotifTarget] = useState<string>("all");
  const [notifType, setNotifType] = useState<"message" | "chest">("message");
  const [notifText, setNotifText] = useState("");
  const [notifChestPoints, setNotifChestPoints] = useState(10);
  
  const handleSendNotification = async (e: React.FormEvent) => {
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
        const notifRef = doc(collection(db, "notifications"));
        batch.set(notifRef, {
          kidId: kid.id,
          type: notifType,
          title: notifType === "chest" ? "🎁 Вам отправлен СУНДУК!" : "💬 Сообщение от родителей",
          text: notifText.trim() || (notifType === "chest" ? "Откройте сундук, чтобы забрать монеты!" : ""),
          chestPoints: notifType === "chest" ? Number(notifChestPoints) : 0,
          createdAt: new Date(),
          read: false
        });
      }
      
      await batch.commit();
      
      if (settings.telegramChatId) {
        let tgMsg = \`📢 <b>Новое уведомление детям!</b>\\nКому: \${notifTarget === "all" ? "Всем детям" : targets[0].name}\\n\`;
        if (notifType === "chest") {
           tgMsg += \`Подарок: 🎁 Сундук с \${notifChestPoints} монетами!\\n\`;
        }
        if (notifText.trim()) {
           tgMsg += \`Сообщение: <i>\${notifText}</i>\`;
        }
        await sendTelegramNotification(tgMsg, settings.telegramChatId);
      }
      
      showAlert("Успешно!", "Уведомления/сундуки отправлены!");
      setNotifText("");
    } catch(err) {
      console.error(err);
      showAlert("Ошибка", "Не удалось отправить: " + err);
    } finally {
      setLoading(false);
    }
  };
`;

content = content.replace(
  /const \[chestUploading, setChestUploading\] = useState\(false\);/,
  `const [chestUploading, setChestUploading] = useState(false);
  ${notifState}`
);

// Add Tab
const tabStr = `
        <button
          onClick={() => setActiveTab("notifications")}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 \${
            activeTab === "notifications"
              ? \`\${palette.bg} text-white shadow\`
              : "text-slate-600 hover:text-slate-900"
          }\`}
        >
          <Bell className="w-4 h-4" />
          Уведомления и Сундуки
        </button>
`;

content = content.replace(
  /<\/div>\n\n\s+\{\/\* USERS TAB \*\/\}/,
  tabStr + "\n      </div>\n\n      {/* USERS TAB */}"
);

// Add content for notifications tab
const tabContent = `
      {/* NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2 mb-4">
              <Bell className={\`w-5 h-5 \${palette.text}\`} />
              Отправить уведомление или Сундук
            </h3>
            
            <form onSubmit={handleSendNotification} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Кому отправить?</label>
                <select
                  value={notifTarget}
                  onChange={(e) => setNotifTarget(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">👨‍👩‍👧‍👦 Всем детям</option>
                  {users.filter(u => u.role === "kid").map(kid => (
                    <option key={kid.id} value={kid.id}>{kid.avatar} {kid.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Тип отправки</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="notifType" 
                      value="message" 
                      checked={notifType === "message"} 
                      onChange={() => setNotifType("message")}
                      className="accent-indigo-500 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-slate-700">💬 Сообщение</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="notifType" 
                      value="chest" 
                      checked={notifType === "chest"} 
                      onChange={() => setNotifType("chest")}
                      className="accent-amber-500 w-4 h-4"
                    />
                    <span className="font-bold text-sm text-slate-700">📦 Сундук с монетами</span>
                  </label>
                </div>
              </div>
              
              {notifType === "chest" && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Количество монет в сундуке (1 - 50)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={notifChestPoints}
                    onChange={(e) => setNotifChestPoints(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Текст сообщения</label>
                <textarea
                  rows={3}
                  value={notifText}
                  onChange={(e) => setNotifText(e.target.value)}
                  placeholder={notifType === "chest" ? "Например: За отличное поведение на неделе!" : "Например: Пора садиться за уроки!"}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className={\`w-full py-4 \${palette.bg} \${palette.hover} text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2\`}
              >
                {notifType === "chest" ? <Sparkles className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                {notifType === "chest" ? "Отправить Сундук!" : "Отправить Сообщение"}
              </button>
            </form>
          </div>
        </div>
      )}
`;

content = content.replace(
  /\{\/\* SYSTEM TAB \*\/\}/,
  tabContent + "\n\n      {/* SYSTEM TAB */}"
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
