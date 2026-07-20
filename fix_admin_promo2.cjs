const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const regexPromo = /\{\/\* PROMO CODES TAB \*\/\}\s*\{activeTab === "promo" && \([\s\S]*?в этой версии\)<\/p>\s*<\/div>\s*<\/div>\s*\)\}/;

const hookInsert = `
  const [promoCodes, setPromoCodes] = useState<any[]>([]);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const snap = await getDocs(collection(db, "promocodes"));
        const p: any[] = [];
        snap.forEach(doc => p.push(doc.data()));
        setPromoCodes(p);
      } catch (err) {
        console.error("Error fetching promos:", err);
      }
    };
    if (activeTab === "promo") {
      fetchPromos();
    }
  }, [activeTab]);
`;

const newPromoUI = `
      {/* PROMO CODES TAB */}
      {activeTab === "promo" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Ticket className="w-6 h-6 text-indigo-500" />
              Промокоды
            </h2>
            <button
              onClick={async () => {
                const code = prompt("Введите новый промокод (например, SUMMER2024):");
                if (!code || !code.trim()) return;
                const finalCode = code.trim().toUpperCase();
                const amount = parseInt(prompt("Сколько монет дает этот код?", "50") || "0");
                if (!amount) return;
                
                try {
                  await setDoc(doc(db, "promocodes", finalCode), {
                    id: finalCode,
                    amount: amount,
                    usedBy: [],
                    createdAt: new Date()
                  });
                  showAlert("Успех", "Промокод успешно создан!");
                  setPromoCodes(prev => [...prev, { id: finalCode, amount, usedBy: [], createdAt: new Date() }]);
                } catch(e) {
                  console.error(e);
                  showAlert("Ошибка", "Не удалось создать промокод.");
                }
              }}
              className={\`px-4 py-2 \${palette.bg} text-white text-xs font-bold rounded-xl transition-all hover:opacity-90 flex items-center gap-1.5 cursor-pointer\`}
            >
              <Plus className="w-4 h-4" /> Добавить
            </button>
          </div>
          
          <div className="space-y-3">
            {promoCodes.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
                <p className="text-slate-500 font-medium text-sm">У вас пока нет промокодов.</p>
              </div>
            ) : (
              promoCodes.map(promo => (
                <div key={promo.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-black text-indigo-600">{promo.id}</span>
                      <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">+{promo.amount} 🪙</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">Использований: {promo.usedBy?.length || 0}</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (confirm("Точно удалить промокод " + promo.id + "?")) {
                        await deleteDoc(doc(db, "promocodes", promo.id));
                        setPromoCodes(prev => prev.filter(p => p.id !== promo.id));
                      }
                    }}
                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
`;

content = content.replace(regexPromo, newPromoUI);
content = content.replace('const [loading, setLoading] = useState(false);', 'const [loading, setLoading] = useState(false);\n' + hookInsert);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
