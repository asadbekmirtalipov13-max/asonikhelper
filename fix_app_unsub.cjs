const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const notifListener = `
    const unsubNotifications = onSnapshot(collection(db, "notifications"), (snapshot) => {
      const nList: any[] = [];
      snapshot.forEach((doc) => {
        nList.push({ id: doc.id, ...doc.data() });
      });
      nList.sort((a, b) => {
        const timeA = a.createdAt?.seconds || a.createdAt?.getTime?.() || 0;
        const timeB = b.createdAt?.seconds || b.createdAt?.getTime?.() || 0;
        return timeB - timeA;
      });
      setNotifications(nList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "notifications");
    });
`;

content = content.replace(
  /unsubPurchases\(\);\n\s+unsubTransactions\(\);/,
  `unsubPurchases();\n      unsubTransactions();\n      unsubNotifications();`
);

content = content.replace(
  /return \(\) => \{/,
  notifListener + '\n    return () => {'
);

fs.writeFileSync('src/App.tsx', content);
