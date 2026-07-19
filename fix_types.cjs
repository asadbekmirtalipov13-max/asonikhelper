const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(
  /category\?: string; \/\/ e.g. "Игры", "Развлечения", "Сладости", "Другое"/,
  'category?: string; // e.g. "Игры", "Развлечения", "Сладости", "Другое"\n  isChest?: boolean;\n  chestMin?: number;\n  chestMax?: number;'
);

fs.writeFileSync('src/types.ts', content);
