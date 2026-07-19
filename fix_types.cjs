const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(/amount: number;/g, 'amount: number;\n  description?: string;');

fs.writeFileSync('src/types.ts', content);
