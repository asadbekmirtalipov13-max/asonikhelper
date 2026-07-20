const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(/const \[isNotificationsOpen, setIsNotificationsOpen\] = useState\(false\);/, 
`const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [openingChest, setOpeningChest] = useState<any>(null);`);

const openChestRegex = /const handleOpenChest = async \([\s\S]+?\}\;/;
const newOpenChest = `const handleOpenChest = async (notification: any) => {
    if (!notification.chestPoints) return;
    setOpeningChest(notification);
    
    // Fake animation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const kidRef = doc(db, "users", currentUser.id);
    const newBalance = currentUser.points + notification.chestPoints;
    await updateDoc(kidRef, { points: newBalance });
    const txId = "tx-chest-" + Math.random().toString(36).substr(2, 9);
    await setDoc(doc(db, "transactions", txId), {
      id: txId,
      kidId: currentUser.id,
      kidName: currentUser.name,
      type: "income",
      amount: notification.chestPoints,
      description: "Открыт сундук!",
      createdAt: new Date()
    });
    await updateDoc(doc(db, "notifications", notification.id), { chestPoints: 0, title: notification.title + " (Открыто)" });
    
    setOpeningChest(null);
    showAlert("ОТКРЫТ СУНДУК! 🎉", \`Вы получили \${notification.chestPoints} монет из сундука!\`);
  };`;
content = content.replace(openChestRegex, newOpenChest);

const closingRegex = /\{\/\* NOTIFICATIONS MODAL \*\/\}/;
const newUi = `{openingChest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: [0.8, 1.1, 1], rotate: [-5, 5, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
            className="text-8xl mb-6 select-none drop-shadow-2xl"
          >
            🎁
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-black text-white text-center"
          >
            Открываем сундук...
          </motion.h2>
          <p className="text-white/60 font-medium mt-2">Пожалуйста, подождите!</p>
        </div>
      )}
      
      {/* NOTIFICATIONS MODAL */}`;
content = content.replace(closingRegex, newUi);

fs.writeFileSync('src/App.tsx', content);
