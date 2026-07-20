const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /  const handleBuyItem = async \(\) => \{[\s\S]*?    \} finally \{\n      setLoading\(false\);\n      setProcessingOrder\(null\);\n      setProcessingOrder\(null\);\n    \}\n  \};/g;

// I'll replace it completely from "const handleBuyItem = async () => {" to "  // Game Handlers"
