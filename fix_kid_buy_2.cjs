const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /  const handleBuyItem = async \(\) => \{\n    if \(!confirmPurchaseItem \|\| loading\) return;\n    const item = confirmPurchaseItem;/;

const replacement = `  const handleBuyItem = async () => {
    if (!confirmPurchaseItem || loading) return;
    const item = confirmPurchaseItem;
    const customInput = purchaseCustomInput;

    setConfirmPurchaseItem(null);
    setPurchaseCustomInput("");

    if (!item.isChest) {
      setProcessingOrder(true);
    }`;

content = content.replace(regex, replacement);

const regex2 = /          purchasedBy: currentUser\.id,\n          customInput: purchaseCustomInput\n        \}\);/g;
content = content.replace(regex2, `          purchasedBy: currentUser.id,
          customInput: customInput
        });`);

const regex3 = /      setConfirmPurchaseItem\(null\);\n      setPurchaseCustomInput\(""\);\n    \} catch \(err\) \{/g;
content = content.replace(regex3, `    } catch (err) {`);

const regex4 = /    \} finally \{\n      setLoading\(false\);\n    \}/g;
content = content.replace(regex4, `    } finally {
      setLoading(false);
      setProcessingOrder(null);
    }`);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
