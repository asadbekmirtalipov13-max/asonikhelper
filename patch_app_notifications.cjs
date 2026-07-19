const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const \[transactions, setTransactions\] = useState<Transaction\[\]>\(\[\]\);/,
  `const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);`
);

const txListener = `const unsubTransactions = onSnapshot(collection(db, "transactions"), (snapshot) => {
      const txList: Transaction[] = [];
      snapshot.forEach((doc) => {
        txList.push({ id: doc.id, ...doc.data() } as Transaction);
      });
      txList.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return tB - tA;
      });
      setTransactions(txList);
    }, (error) => {
      handleFirestoreError(error, OperationType.READ, "transactions collection");
    });`;

const notifListener = `const unsubNotifications = onSnapshot(collection(db, "notifications"), (snapshot) => {
      const nList: any[] = [];
      snapshot.forEach((doc) => {
        nList.push({ id: doc.id, ...doc.data() });
      });
      nList.sort((a, b) => {
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return tB - tA;
      });
      setNotifications(nList);
    }, (error) => {
      handleFirestoreError(error, OperationType.READ, "notifications collection");
    });`;

content = content.replace(txListener, txListener + '\n\n    ' + notifListener);

content = content.replace(
  /unsubTransactions\(\);/,
  `unsubTransactions();
      unsubNotifications();`
);

content = content.replace(
  /transactions=\{transactions\}/g,
  `transactions={transactions} notifications={notifications}`
);

fs.writeFileSync('src/App.tsx', content);
