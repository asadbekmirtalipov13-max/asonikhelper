const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(
  /const \[activeTab, setActiveTab\] = useState<"users" \| "telegram" \| "branding" \| "system" \| "notifications" \| "faq" \| "categories" \| "promo" \| "achievements">/,
  'const [activeTab, setActiveTab] = useState<"users" | "telegram" | "branding" | "system" | "notifications" | "faq" | "categories" | "promo" | "achievements" | "updates">'
);

const tabsMenuRegex = /<button\n\s*onClick=\{\(\) => setActiveTab\("system"\)\}\n\s*className=\{\`px-4 py-2 text-sm font-black rounded-xl transition-all whitespace-nowrap \$\{activeTab === "system" \? `\$\{palette.bg\} text-white shadow-sm` : "text-slate-500 hover:bg-slate-100"\}\`\}\n\s*>\n\s*Система\n\s*<\/button>/;

const tabsMenuReplacement = `<button
              onClick={() => setActiveTab("system")}
              className={\`px-4 py-2 text-sm font-black rounded-xl transition-all whitespace-nowrap \${activeTab === "system" ? \`\${palette.bg} text-white shadow-sm\` : "text-slate-500 hover:bg-slate-100"}\`}
            >
              Система
            </button>
            <button
              onClick={() => setActiveTab("updates")}
              className={\`px-4 py-2 text-sm font-black rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 \${activeTab === "updates" ? \`\${palette.bg} text-white shadow-sm\` : "text-slate-500 hover:bg-slate-100"}\`}
            >
              <Sparkles className="w-4 h-4" /> Обновления
            </button>`;

content = content.replace(tabsMenuRegex, tabsMenuReplacement);

// Add Updates Content Panel
const systemTabEndRegex = /\{\/\* SYSTEM SETTINGS \*\/\}/;

const updatesTabHtml = `{/* UPDATES TAB */}
      {activeTab === "updates" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Выкатить обновление</h3>
              <p className="text-sm text-slate-500 font-bold mt-1">Отправьте новость об обновлениях детям на платформе и в Telegram.</p>
            </div>
          </div>
          
          <form onSubmit={async (e) => {
            e.preventDefault();
            const title = (e.target as any).updateTitle.value;
            const text = (e.target as any).updateText.value;
            if (!title || !text) return;
            setLoading(true);
            try {
              const version = Date.now();
              await updateDoc(doc(db, "settings", "global"), {
                latestUpdate: { title, text, version }
              });
              
              if (settings.telegramChatId) {
                await sendTelegramNotification(\`🚀 <b>ОБНОВЛЕНИЕ ПЛАТФОРМЫ: \${title}</b>\\n\\n\${text}\`, settings.telegramChatId);
              }
              
              showAlert("Успешно", "Обновление опубликовано!");
              (e.target as any).reset();
            } catch (err) {
              showAlert("Ошибка", "Не удалось выкатить обновление.");
            } finally {
              setLoading(false);
            }
          }} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Заголовок обновления</label>
              <input name="updateTitle" type="text" placeholder="Версия 2.0: Новые игры!" required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Что нового? (текст)</label>
              <textarea name="updateText" rows={5} placeholder="Мы добавили новые крутые функции..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
            </div>
            <button type="submit" disabled={loading} className={\`w-full py-3 \${palette.bg} \${palette.hover} text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer\`}>
              {loading ? "Загрузка..." : <><Rocket className="w-5 h-5" /> Опубликовать Обновление</>}
            </button>
          </form>
        </div>
      )}

      {/* SYSTEM SETTINGS */}`;

content = content.replace(systemTabEndRegex, updatesTabHtml);

// Add missing icon import
content = content.replace(/import \{ Users, \n?  Settings, \n?  Shield, \n?  Trash2, \n?  Save, \n?  RefreshCw, \n?  Palette, \n?  MessageCircle, \n?  Send, \n?  HelpCircle, \n?  Plus, \n?  Edit2, \n?  X, \n?  Layers, \n?  Tag, \n?  Image as ImageIcon, \n?  Copy, \n?  Trophy/g, 'import { Users, Settings, Shield, Trash2, Save, RefreshCw, Palette, MessageCircle, Send, HelpCircle, Plus, Edit2, X, Layers, Tag, Image as ImageIcon, Copy, Trophy, Sparkles, Rocket');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
