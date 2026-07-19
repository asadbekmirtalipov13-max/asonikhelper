const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const endOfFileRegex = /    <\/div>\n  \);\n\}/;
const match = content.match(endOfFileRegex);

if (match) {
  content = content.replace(endOfFileRegex, `
      {/* NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8 space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-500" />
            Рассылка и Сундуки
          </h2>
          <div className="max-w-xl">
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Кому отправить</label>
                <select 
                  value={notifTarget} 
                  onChange={e => setNotifTarget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Всем детям</option>
                  {users.filter(u => u.role === "kid").map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Тип отправки</label>
                <select 
                  value={notifType} 
                  onChange={e => setNotifType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="message">Обычное сообщение</option>
                  <option value="chest">Сундук с монетами</option>
                </select>
              </div>

              {notifType === "message" && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Сообщение</label>
                  <textarea
                    required
                    value={notifText}
                    onChange={e => setNotifText(e.target.value)}
                    rows={3}
                    placeholder="Молодец, сегодня отлично потрудился!"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {notifType === "chest" && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Сколько монет в сундуке</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={notifChestPoints}
                    onChange={e => setNotifChestPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Ребенок получит уведомление и сможет забрать монеты, нажав на него.</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={\`w-full py-3 \${palette.bg} \${palette.hover} text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer\`}
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Отправить
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAQ TAB */}
      {activeTab === "faq" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-indigo-500" />
              Вопросы и Ответы (FAQ)
            </h2>
            <button
              onClick={handleAddFaq}
              className={\`px-4 py-2 \${palette.bg} text-white text-xs font-bold rounded-xl transition-all hover:opacity-90 flex items-center gap-1.5 cursor-pointer\`}
            >
              <Plus className="w-4 h-4" /> Добавить
            </button>
          </div>
          
          <div className="space-y-4">
            {faqs.map(faq => (
              <div key={faq.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                <button 
                  onClick={() => handleRemoveFaq(faq.id)}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Вопрос</label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={e => handleUpdateFaq(faq.id, "question", e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ответ</label>
                  <textarea
                    value={faq.answer}
                    onChange={e => handleUpdateFaq(faq.id, "answer", e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}
            {faqs.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                Нет ни одного вопроса.
              </div>
            )}
          </div>
          
          <button
            onClick={handleSaveFaqs}
            disabled={loading}
            className={\`w-full py-3 mt-4 \${palette.bg} \${palette.hover} text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer\`}
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Сохранить FAQ
          </button>
        </div>
      )}

      {/* PROMO CODES TAB */}
      {activeTab === "promo" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-indigo-500" />
              Промокоды
            </h2>
          </div>
          <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
            <p className="text-slate-500 font-medium">В разработке...</p>
          </div>
        </div>
      )}

      {/* ACHIEVEMENTS TAB */}
      {activeTab === "achievements" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-indigo-500" />
              Достижения
            </h2>
          </div>
          <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
            <p className="text-slate-500 font-medium">В разработке...</p>
          </div>
        </div>
      )}

    </div>
  );
}`);
  fs.writeFileSync('src/components/AdminPanel.tsx', content);
} else {
  console.log("Could not find end of file.");
}
