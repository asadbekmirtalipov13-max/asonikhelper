const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// handleGiftItem
let giftLogicRegex = /(const purchaseId = "purchase-" \+ Math\.random\(\)\.toString\(36\)\.substr\(2, 9\);\n\s*)await updateDoc\(kidRef, \{ points: currentUser\.points - finalPrice \}\);\n\s*(await setDoc\(doc\(db, "purchases", purchaseId\), \{[\s\S]*?giftedBy: currentUser\.name\n\s*\}\);)/;
content = content.replace(giftLogicRegex, '$1$2');

let txGiftRegex = /(await setDoc\(doc\(db, "transactions", txId\), \{[\s\S]*?balanceAfter: currentUser\.points - finalPrice\n\s*\}\);)/;
content = content.replace(txGiftRegex, '$1\n      await updateDoc(kidRef, { points: currentUser.points - finalPrice });');


// handleBuyItem
let buyLogicRegex = /(const purchaseId = "purchase-" \+ Math\.random\(\)\.toString\(36\)\.substr\(2, 9\);\n\s*)await updateDoc\(kidRef, \{ points: currentUser\.points - finalPrice \}\);\n\s*(await setDoc\(doc\(db, "purchases", purchaseId\), \{[\s\S]*?customInput: customInput \|\| ""\n\s*\}\);)/;
content = content.replace(buyLogicRegex, '$1$2');

let txBuyRegex = /(await setDoc\(doc\(db, "transactions", txId\), \{[\s\S]*?balanceAfter: currentUser\.points - finalPrice\n\s*\}\);)/;
content = content.replace(txBuyRegex, '$1\n        await updateDoc(kidRef, { points: currentUser.points - finalPrice });');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
