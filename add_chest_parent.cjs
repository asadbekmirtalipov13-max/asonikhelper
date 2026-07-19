const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

// Add states for chest
content = content.replace(
  /const \[itemRequiresInput, setItemRequiresInput\] = useState\(false\);/,
  `const [itemRequiresInput, setItemRequiresInput] = useState(false);
  const [itemIsChest, setItemIsChest] = useState(false);
  const [itemChestMin, setItemChestMin] = useState(10);
  const [itemChestMax, setItemChestMax] = useState(100);`
);

content = content.replace(
  /const \[editItemRequiresInput, setEditItemRequiresInput\] = useState\(false\);/,
  `const [editItemRequiresInput, setEditItemRequiresInput] = useState(false);
  const [editItemIsChest, setEditItemIsChest] = useState(false);
  const [editItemChestMin, setEditItemChestMin] = useState(10);
  const [editItemChestMax, setEditItemChestMax] = useState(100);`
);

// Populate edit states
const startEditingItemRegex = /setEditItemRequiresInput\(item\.requiresInput \|\| false\);/;
content = content.replace(
  startEditingItemRegex,
  `setEditItemRequiresInput(item.requiresInput || false);
    setEditItemIsChest(item.isChest || false);
    setEditItemChestMin(item.chestMin || 10);
    setEditItemChestMax(item.chestMax || 100);`
);

// Update handleCreateMarketItem
const newItemRegex = /requiresInput: itemRequiresInput,\n\s*inputLabel: itemRequiresInput \? itemInputLabel : undefined\n\s*\};/;
content = content.replace(
  newItemRegex,
  `requiresInput: itemRequiresInput,
        inputLabel: itemRequiresInput ? itemInputLabel : undefined,
        isChest: itemIsChest,
        chestMin: itemIsChest ? Number(itemChestMin) : undefined,
        chestMax: itemIsChest ? Number(itemChestMax) : undefined
      };`
);

// Reset form after create
content = content.replace(
  /setItemRequiresInput\(false\);\n\s*setItemInputLabel\(""\);/,
  `setItemRequiresInput(false);
      setItemInputLabel("");
      setItemIsChest(false);
      setItemChestMin(10);
      setItemChestMax(100);`
);

// Update handleUpdateMarketItem
const editItemRegex = /requiresInput: editItemRequiresInput,\n\s*inputLabel: editItemRequiresInput \? editItemInputLabel : undefined\n\s*\};/;
content = content.replace(
  editItemRegex,
  `requiresInput: editItemRequiresInput,
        inputLabel: editItemRequiresInput ? editItemInputLabel : undefined,
        isChest: editItemIsChest,
        chestMin: editItemIsChest ? Number(editItemChestMin) : undefined,
        chestMax: editItemIsChest ? Number(editItemChestMax) : undefined
      };`
);

// Update UI in Create form
const createFormCheckboxRegex = /<label className="flex items-center gap-2 cursor-pointer">\n\s*<input\n\s*type="checkbox"\n\s*checked=\{itemRequiresInput\}/;
content = content.replace(
  createFormCheckboxRegex,
  `<div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemIsChest}
                    onChange={(e) => setItemIsChest(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                  />
                  <span className="text-sm font-bold text-slate-700 flex items-center gap-1">📦 Это Сундук с монетами</span>
                </label>
                {itemIsChest && (
                  <div className="flex gap-2 pl-6">
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500">Мин. монет</label>
                      <input type="number" value={itemChestMin} onChange={e=>setItemChestMin(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold" min="1" />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-bold text-slate-500">Макс. монет</label>
                      <input type="number" value={itemChestMax} onChange={e=>setItemChestMax(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold" min="1" />
                    </div>
                  </div>
                )}
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemRequiresInput}`
);

// Update UI in Edit form
const editFormCheckboxRegex = /<label className="flex items-center gap-2 cursor-pointer">\n\s*<input\n\s*type="checkbox"\n\s*checked=\{editItemRequiresInput\}/;
content = content.replace(
  editFormCheckboxRegex,
  `<div className="flex flex-col gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editItemIsChest}
                        onChange={(e) => setEditItemIsChest(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                      />
                      <span className="text-sm font-bold text-slate-700 flex items-center gap-1">📦 Это Сундук с монетами</span>
                    </label>
                    {editItemIsChest && (
                      <div className="flex gap-2 pl-6">
                        <div className="flex-1">
                          <label className="text-xs font-bold text-slate-500">Мин. монет</label>
                          <input type="number" value={editItemChestMin} onChange={e=>setEditItemChestMin(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold" min="1" />
                        </div>
                        <div className="flex-1">
                          <label className="text-xs font-bold text-slate-500">Макс. монет</label>
                          <input type="number" value={editItemChestMax} onChange={e=>setEditItemChestMax(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold" min="1" />
                        </div>
                      </div>
                    )}
                    
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editItemRequiresInput}`
);

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
