import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

# Let's replace the entire activeTab === "promo" block with <PromoManager db={db} showAlert={showAlert} />
promo_block_regex = r'\{activeTab === "promo" && \([\s\S]*?\{/\* ACHIEVEMENTS TAB \*/\}'

new_promo_block = """{activeTab === "promo" && (
        <PromoManager db={db} showAlert={showAlert} />
      )}

      {/* ACHIEVEMENTS TAB */}"""

content = re.sub(promo_block_regex, new_promo_block, content)

# Remove the old PromoList if it exists
promo_list_regex = r'const PromoList = \(\{ db \}: any\) => \{[\s\S]*?return \([\s\S]*?\);\s*\};\s*'
content = re.sub(promo_list_regex, '', content)

# We need to insert PromoManager before export default function AdminPanel
promo_manager_code = """const PromoManager = ({ db, showAlert }: { db: any, showAlert: any }) => {
  const [promos, setPromos] = React.useState<any[]>([]);
  const [marketItems, setMarketItems] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const promoSnap = await getDocs(collection(db, "promocodes"));
        setPromos(promoSnap.docs.map(d => d.data()));

        const marketSnap = await getDocs(collection(db, "market"));
        setMarketItems(marketSnap.docs.map(d => d.data()));
      } catch(e) { console.error(e); }
    };
    fetchData();
  }, [db]);

  const handleCreate = async () => {
    const codeInput = document.getElementById("newPromoCode") as HTMLInputElement;
    const pointsInput = document.getElementById("newPromoPoints") as HTMLInputElement;
    const limitInput = document.getElementById("newPromoLimit") as HTMLInputElement;
    const chestInput = document.getElementById("newPromoChest") as HTMLInputElement;
    const productInput = document.getElementById("newPromoProduct") as HTMLSelectElement;

    const code = codeInput?.value?.trim().toUpperCase();
    const points = Number(pointsInput?.value) || 0;
    const limit = Number(limitInput?.value) || 1;
    const isChest = chestInput?.checked || false;
    const productId = productInput?.value || "";

    if (!code || limit <= 0) {
      showAlert("Ошибка", "Введите код и количество активаций");
      return;
    }
    
    if (points <= 0 && !isChest && !productId) {
      showAlert("Ошибка", "Промокод должен давать хотя бы монеты, сундук или товар.");
      return;
    }

    try {
      const docId = code; // Use the code as the document ID for uniqueness and easy lookup
      
      const docSnap = await getDoc(doc(db, "promocodes", docId));
      if (docSnap.exists()) {
        showAlert("Ошибка", "Такой промокод уже существует!");
        return;
      }

      await setDoc(doc(db, "promocodes", docId), {
        id: docId,
        code: docId,
        points: points,
        chest: isChest,
        productId: productId,
        activationsLeft: limit,
        active: true,
        createdAt: new Date(),
        usedBy: []
      });
      
      codeInput.value = "";
      pointsInput.value = "10";
      limitInput.value = "1";
      chestInput.checked = false;
      productInput.value = "";
      
      showAlert("Успех", "Промокод успешно создан!");
      
      const newSnap = await getDocs(collection(db, "promocodes"));
      setPromos(newSnap.docs.map(d => d.data()));
    } catch(e) { 
      console.error(e); 
      showAlert("Ошибка", "Не удалось создать промокод");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Точно удалить промокод " + id + "?")) {
      await deleteDoc(doc(db, "promocodes", id));
      setPromos(prev => prev.filter(p => p.id !== id));
    }
  };

  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-indigo-500" />
          Промокоды
        </h2>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h3 className="font-bold text-sm text-slate-800 mb-4">Создать новый промокод</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Код</label>
            <input type="text" id="newPromoCode" placeholder="GIFT2024" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Активаций</label>
            <input type="number" id="newPromoLimit" defaultValue={1} min={1} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Монеты</label>
            <input type="number" id="newPromoPoints" defaultValue={10} min={0} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="flex items-end pb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="newPromoChest" className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500" />
              <span className="text-xs font-bold text-slate-700">Дать сундук</span>
            </label>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Товар из магазина</label>
            <select id="newPromoProduct" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">-- Без товара --</option>
              {marketItems.map(item => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>
        </div>
        <button 
          onClick={handleCreate}
          className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
        >
          Создать промокод
        </button>
      </div>

      <div className="space-y-3">
        {promos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
            Нет активных промокодов.
          </div>
        ) : (
          promos.map(promo => (
            <div key={promo.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-lg font-black text-indigo-600">{promo.code || promo.id}</span>
                  {(promo.points > 0 || promo.amount > 0) && (
                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">+{promo.points || promo.amount} 🪙</span>
                  )}
                  {promo.chest && (
                    <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">📦 Сундук</span>
                  )}
                  {promo.productId && marketItems.find(i => i.id === promo.productId) && (
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                      🛍 {marketItems.find(i => i.id === promo.productId)?.title}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">Осталось активаций: {promo.activationsLeft ?? (promo.active ? 'Безлимит' : 0)}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Использований: {promo.usedBy?.length || 0}</p>
              </div>
              <button
                onClick={() => handleDelete(promo.id)}
                className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default function AdminPanel"""

content = content.replace("export default function AdminPanel", promo_manager_code)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
