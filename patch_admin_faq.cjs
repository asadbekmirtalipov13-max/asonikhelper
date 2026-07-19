const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const faqTabStr = `
        <button
          onClick={() => setActiveTab("faq")}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 \${
            activeTab === "faq"
              ? \`\${palette.bg} text-white shadow\`
              : "text-slate-600 hover:text-slate-900"
          }\`}
        >
          <HelpCircle className="w-4 h-4" />
          Вопросы и Ответы (FAQ)
        </button>
`;

content = content.replace(
  /<\/div>\n\n\s+\{\/\* USERS TAB \*\/\}/,
  faqTabStr + "\n      </div>\n\n      {/* USERS TAB */}"
);

const faqState = `
  const [faqs, setFaqs] = useState(settings.faqs || [
    { id: "1", question: "Как получить монеты?", answer: "Выполняйте квесты, которые выдают родители, и отмечайтесь каждый день в календаре!" }
  ]);
  
  const handleAddFaq = () => {
    setFaqs([...faqs, { id: Math.random().toString(), question: "Новый вопрос?", answer: "Ответ на вопрос..." }]);
  };
  
  const handleUpdateFaq = (id, field, value) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, [field]: value } : f));
  };
  
  const handleRemoveFaq = (id) => {
    setFaqs(faqs.filter(f => f.id !== id));
  };
  
  const handleSaveFaqs = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "settings", "global"), { faqs });
      onUpdateSettings({ faqs });
      showAlert("Сохранено", "FAQ успешно обновлен.");
    } catch(err) {
      showAlert("Ошибка", "Не удалось сохранить FAQ.");
    } finally {
      setLoading(false);
    }
  };
`;

content = content.replace(
  /const \[chestUploading, setChestUploading\] = useState\(false\);/,
  `const [chestUploading, setChestUploading] = useState(false);\n  ${faqState}`
);

const faqContent = `
      {/* FAQ TAB */}
      {activeTab === "faq" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <HelpCircle className={\`w-5 h-5 \${palette.text}\`} />
                Частые вопросы (FAQ) для детей
              </h3>
              <button
                onClick={handleSaveFaqs}
                disabled={loading}
                className={\`px-5 py-2.5 \${palette.bg} \${palette.hover} text-white text-sm font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2\`}
              >
                <Save className="w-4 h-4" />
                Сохранить FAQ
              </button>
            </div>
            
            <div className="space-y-4 max-w-3xl">
              {faqs.map((faq, index) => (
                <div key={faq.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative group">
                  <button
                    onClick={() => handleRemoveFaq(faq.id)}
                    className="absolute -top-2 -right-2 bg-rose-100 hover:bg-rose-500 text-rose-500 hover:text-white p-1.5 rounded-full transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Вопрос</label>
                      <input
                        type="text"
                        value={faq.question}
                        onChange={(e) => handleUpdateFaq(faq.id, "question", e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ответ</label>
                      <textarea
                        rows={2}
                        value={faq.answer}
                        onChange={(e) => handleUpdateFaq(faq.id, "answer", e.target.value)}
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={handleAddFaq}
                className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" /> Добавить вопрос
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  /\{\/\* SYSTEM TAB \*\/\}/,
  faqContent + "\n\n      {/* SYSTEM TAB */}"
);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
