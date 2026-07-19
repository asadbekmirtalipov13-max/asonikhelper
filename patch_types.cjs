const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(
  /parentFeedback\?: string; \/\/ Feedback from parent on approval\/rejection/,
  "parentFeedback?: string; // Feedback from parent on approval/rejection\n  isUrgent?: boolean;"
);

fs.writeFileSync('src/types.ts', content);
