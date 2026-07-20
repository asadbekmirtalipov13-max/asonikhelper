const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /const \[confirmPurchaseItem, setConfirmPurchaseItem\] = useState<MarketItem \| null>\(null\);\n\s*const \[purchaseCustomInput, setPurchaseCustomInput\] = useState\(""\);/;
const replacement = `const [confirmPurchaseItem, setConfirmPurchaseItem] = useState<MarketItem | null>(null);
  const [purchaseCustomInput, setPurchaseCustomInput] = useState("");
  const [giftPurchaseItem, setGiftPurchaseItem] = useState<MarketItem | null>(null);
  const [giftTargetId, setGiftTargetId] = useState("");`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
