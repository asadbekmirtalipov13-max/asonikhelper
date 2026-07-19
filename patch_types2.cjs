const fs = require('fs');
let content = fs.readFileSync('src/types.ts', 'utf8');

content = content.replace(
  /inputLabel\?: string;/, ""
); // safe check

content = content.replace(
  /discountUntil\?: any; \/\/ Timestamp when sale ends/,
  `discountUntil?: any; // Timestamp when sale ends
  requiresInput?: boolean;
  inputLabel?: string;`
);

content = content.replace(
  /issuedAt\?: any;/,
  `issuedAt?: any;
  customInput?: string;`
);

content = content.replace(
  /categories\?: string\[\]; \/\/ Custom store categories/,
  `categories?: string[]; // Custom store categories
  faqs?: { id: string; question: string; answer: string }[];`
);

content += `\nexport interface AppNotification {
  id: string;
  kidId: string;
  title: string;
  text: string;
  createdAt: any;
  read: boolean;
  type?: "message" | "chest" | "quest" | "system";
  chestPoints?: number;
}\n`;

fs.writeFileSync('src/types.ts', content);
