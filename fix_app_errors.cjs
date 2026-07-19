const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// import sendTelegramNotification
content = content.replace(
  /import \{ TAILWIND_COLOR_PALETTES \} from "\.\/presets";/,
  `import { TAILWIND_COLOR_PALETTES } from "./presets";\nimport { sendTelegramNotification } from "./utils/telegram";`
);

// find unsubNotifications
content = content.replace(
  /unsubTransactions\(\);\n\s+unsubNotifications\(\);/g,
  `unsubTransactions();\n      if(typeof unsubNotifications !== "undefined") unsubNotifications();`
);

fs.writeFileSync('src/App.tsx', content);
