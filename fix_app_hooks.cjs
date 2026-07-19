const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const useEffectCode = content.match(/\/\/\ Telegram Urgent notifications cron[\s\S]+?\}, \[chores, settings\.telegramChatId\]\);/)[0];

// Remove it from its current position
content = content.replace(useEffectCode, '');

// Insert it BEFORE `if (dbLoading && !currentUser) {`
content = content.replace(
  /if \(dbLoading && !currentUser\) \{/,
  useEffectCode + '\n\n  if (dbLoading && !currentUser) {'
);

fs.writeFileSync('src/App.tsx', content);
