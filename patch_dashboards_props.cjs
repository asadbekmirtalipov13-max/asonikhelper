const fs = require('fs');

['src/components/KidDashboard.tsx', 'src/components/ParentDashboard.tsx'].forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  content = content.replace(
    /import \{ Chore, FamilyUser, MarketItem, Purchase, SiteSettings, Transaction \} from "\.\.\/types";/,
    `import { AppNotification, Chore, FamilyUser, MarketItem, Purchase, SiteSettings, Transaction } from "../types";`
  );
  
  content = content.replace(
    /transactions: Transaction\[\];/,
    `transactions: Transaction[];
  notifications: AppNotification[];`
  );
  
  content = content.replace(
    /transactions = \[\],/,
    `transactions = [],
  notifications = [],`
  );
  
  fs.writeFileSync(file, content);
});
