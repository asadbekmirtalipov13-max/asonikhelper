const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

// Fix handleSaveEditedItem
const saveEditedRegex = /await updateDoc\(doc\(db, "marketplace", id\), \{([\s\S]*?)discountUntil\n\s*\}\);/;
const saveEditedReplacement = `await updateDoc(doc(db, "marketplace", id), {$1discountUntil,
        requiresInput: editItemRequiresInput,
        inputLabel: editItemInputLabel,
        isChest: editItemIsChest,
        chestMin: Number(editItemChestMin),
        chestMax: Number(editItemChestMax)
      });`;
content = content.replace(saveEditedRegex, saveEditedReplacement);

// Fix handleAddItem
const addItemRegex = /const newItem: MarketItem = \{([\s\S]*?)discountUntil\n\s*\};/;
const addItemReplacement = `const newItem: MarketItem = {$1discountUntil,
        requiresInput: itemRequiresInput,
        inputLabel: itemInputLabel,
        isChest: itemIsChest,
        chestMin: Number(itemChestMin),
        chestMax: Number(itemChestMax)
      };`;
content = content.replace(addItemRegex, addItemReplacement);

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
