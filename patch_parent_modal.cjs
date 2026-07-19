const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

// 1. Add state for modal and requiresInput
content = content.replace(
  /const \[editItemHidden, setEditItemHidden\] = useState\(false\);/,
  `const [editItemHidden, setEditItemHidden] = useState(false);
  const [isCreateChoreModalOpen, setIsCreateChoreModalOpen] = useState(false);
  const [itemRequiresInput, setItemRequiresInput] = useState(false);
  const [itemInputLabel, setItemInputLabel] = useState("");
  const [editItemRequiresInput, setEditItemRequiresInput] = useState(false);
  const [editItemInputLabel, setEditItemInputLabel] = useState("");`
);

// 2. Add requiresInput logic in startEditingItem
content = content.replace(
  /setEditItemImage\(item\.image\);/,
  `setEditItemImage(item.image);
    setEditItemRequiresInput(item.requiresInput || false);
    setEditItemInputLabel(item.inputLabel || "");`
);

// 3. handleCreateItem and handleSaveEditItem modification
content = content.replace(
  /pinned: itemPinned,\n\s+hidden: itemHidden,\n\s+discountPercentage: Number\(itemDiscount\) \|\| undefined/,
  `pinned: itemPinned,
          hidden: itemHidden,
          discountPercentage: Number(itemDiscount) || undefined,
          requiresInput: itemRequiresInput,
          inputLabel: itemRequiresInput ? itemInputLabel.trim() : ""`
);

content = content.replace(
  /pinned: editItemPinned,\n\s+hidden: editItemHidden,\n\s+discountPercentage: Number\(editItemDiscount\) \|\| undefined/,
  `pinned: editItemPinned,
          hidden: editItemHidden,
          discountPercentage: Number(editItemDiscount) || undefined,
          requiresInput: editItemRequiresInput,
          inputLabel: editItemRequiresInput ? editItemInputLabel.trim() : ""`
);

content = content.replace(
  /setItemHidden\(false\);/,
  `setItemHidden(false);
      setItemRequiresInput(false);
      setItemInputLabel("");`
);

// 4. Update the layout of "chores" view
const regexChores = /\{view === "chores" && \([\s\S]+?\{view === "market" && \(/;
const newChores = `{view === "chores" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
               <Award className="w-4.5 h-4.5 text-indigo-500" />
               Все выданные задания
             </h3>
             <button
               onClick={() => setIsCreateChoreModalOpen(true)}
               className={\`px-4 py-2 \${palette.bg} \${palette.hover} text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-2\`}
             >
               <Plus className="w-4 h-4" /> Добавить задание
             </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* The rest of the chores rendering here, wait I need to replace properly */}
`;
// Let's do it using replace on just the form section
fs.writeFileSync('src/components/ParentDashboard.tsx', content);
