import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

content = content.replace('collection(db, "market")', 'collection(db, "marketplace")')

# Replace the promo creation UI to use a single reward type
old_promo_ui = """        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
        </div>"""

new_promo_ui = """        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Код</label>
            <input type="text" id="newPromoCode" placeholder="GIFT2024" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Активаций</label>
            <input type="number" id="newPromoLimit" defaultValue={1} min={1} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Тип награды</label>
            <select id="newPromoType" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" onChange={(e) => {
                document.getElementById("promoCoinsWrap")!.style.display = e.target.value === "coins" ? "block" : "none";
                document.getElementById("promoProductWrap")!.style.display = e.target.value === "product" ? "block" : "none";
            }}>
              <option value="coins">Монеты</option>
              <option value="chest">Сундук</option>
              <option value="product">Товар из магазина</option>
            </select>
          </div>
          
          <div id="promoCoinsWrap">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Монеты</label>
            <input type="number" id="newPromoPoints" defaultValue={10} min={1} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          
          <div id="promoProductWrap" style={{display: 'none'}}>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Товар</label>
            <select id="newPromoProduct" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
              {marketItems.map(item => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>
        </div>"""

old_handle_create = """  const handleCreate = async () => {
    const codeInput = document.getElementById("newPromoCode") as HTMLInputElement;
    const pointsInput = document.getElementById("newPromoPoints") as HTMLInputElement;
    const limitInput = document.getElementById("newPromoLimit") as HTMLInputElement;
    const chestInput = document.getElementById("newPromoChest") as HTMLInputElement;
    const productInput = document.getElementById("newPromoProduct") as HTMLSelectElement;

    const code = codeInput?.value?.trim().toUpperCase();
    const points = Number(pointsInput?.value) || 0;
    const limit = Number(limitInput?.value) || 1;
    const isChest = chestInput?.checked || false;
    const productId = productInput?.value || "";"""

new_handle_create = """  const handleCreate = async () => {
    const codeInput = document.getElementById("newPromoCode") as HTMLInputElement;
    const typeInput = document.getElementById("newPromoType") as HTMLSelectElement;
    const limitInput = document.getElementById("newPromoLimit") as HTMLInputElement;
    const pointsInput = document.getElementById("newPromoPoints") as HTMLInputElement;
    const productInput = document.getElementById("newPromoProduct") as HTMLSelectElement;

    const code = codeInput?.value?.trim().toUpperCase();
    const type = typeInput?.value;
    const limit = Number(limitInput?.value) || 1;
    const points = type === "coins" ? (Number(pointsInput?.value) || 0) : 0;
    const isChest = type === "chest";
    const productId = type === "product" ? (productInput?.value || "") : "";"""

content = content.replace(old_promo_ui, new_promo_ui)
content = content.replace(old_handle_create, new_handle_create)

# Also fix the chest logic to not look for newPromoChest
content = content.replace('chestInput.checked = false;', '')

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
