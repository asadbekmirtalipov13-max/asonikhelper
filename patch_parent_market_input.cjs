const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

const requiresInputCode = `
              <div className="flex items-center gap-2 mt-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <input
                  type="checkbox"
                  id="requiresInput"
                  checked={itemRequiresInput}
                  onChange={(e) => setItemRequiresInput(e.target.checked)}
                  className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-500"
                />
                <label htmlFor="requiresInput" className="text-xs font-bold text-indigo-600 uppercase cursor-pointer select-none">
                  Требовать ввод данных при покупке (например, номер карты)
                </label>
              </div>
              {itemRequiresInput && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Текст над полем ввода</label>
                  <input
                    type="text"
                    required
                    placeholder="Введите номер карты"
                    value={itemInputLabel}
                    onChange={(e) => setItemInputLabel(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
`;

content = content.replace(
  /<div>\n\s+<label className="block text-\[10px\] font-bold text-slate-400 uppercase text-rose-500">Скидка по акции % \(1-99\)<\/label>/,
  requiresInputCode + '\n              <div>\n                <label className="block text-[10px] font-bold text-slate-400 uppercase text-rose-500">Скидка по акции % (1-99)</label>'
);

// Do the same for editing item
const editRequiresInputCode = `
                  <div className="flex items-center gap-2 mt-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                    <input
                      type="checkbox"
                      id="editRequiresInput"
                      checked={editItemRequiresInput}
                      onChange={(e) => setEditItemRequiresInput(e.target.checked)}
                      className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-500"
                    />
                    <label htmlFor="editRequiresInput" className="text-xs font-bold text-indigo-600 uppercase cursor-pointer select-none">
                      Требовать ввод данных при покупке
                    </label>
                  </div>
                  {editItemRequiresInput && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Текст над полем ввода</label>
                      <input
                        type="text"
                        required
                        placeholder="Введите номер карты"
                        value={editItemInputLabel}
                        onChange={(e) => setEditItemInputLabel(e.target.value)}
                        className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  )}
`;

content = content.replace(
  /<div>\n\s+<label className="block text-\[10px\] font-bold text-slate-400 uppercase text-rose-500">Скидка \(%\)<\/label>/,
  editRequiresInputCode + '\n                  <div>\n                    <label className="block text-[10px] font-bold text-slate-400 uppercase text-rose-500">Скидка (%)</label>'
);

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
