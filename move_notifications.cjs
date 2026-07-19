const fs = require('fs');
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
let kidContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// App.tsx header replacement
const headerRegex = /\{\/\*\ Logout\ \*\/\}/;
const newHeader = `
            {/* Notifications */}
            {currentUser.role === "kid" && (
              <button
                onClick={() => {
                  setIsNotificationsOpen(true);
                  const unread = notifications.filter(n => n.kidId === currentUser.id && !n.read);
                  unread.forEach(n => {
                    updateDoc(doc(db, "notifications", n.id), { read: true });
                  });
                }}
                className="relative p-2 text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-xl transition-all border border-transparent hover:border-indigo-100 cursor-pointer"
                title="Уведомления"
              >
                <Bell className="w-5 h-5" />
                {notifications.filter(n => n.kidId === currentUser.id && !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 bg-rose-500 w-2.5 h-2.5 rounded-full border-2 border-white"></span>
                )}
              </button>
            )}

            {/* Logout */}`;

appContent = appContent.replace(headerRegex, newHeader);

// Add isNotificationsOpen state in App.tsx
appContent = appContent.replace(
  /const \[currentView, setCurrentView\] = useState<\n?\s*"dashboard" | "admin" | "store"\n?\s*>\("dashboard"\);/,
  `const [currentView, setCurrentView] = useState<"dashboard" | "admin" | "store">("dashboard");\n  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);`
);

// Add Bell import in App.tsx
appContent = appContent.replace(
  /import \{ LogOut, Settings, Award, Save, CheckCircle2, ChevronRight \} from "lucide-react";/,
  `import { LogOut, Settings, Award, Save, CheckCircle2, ChevronRight, Bell, X, Package } from "lucide-react";\nimport { motion, AnimatePresence } from "motion/react";`
);

// We need to move the notification modal to App.tsx
// I will just append it before </main>
const modalRegex = /\{\/\*\ Notifications Modal \*\/\}([\s\S]+?)<\/AnimatePresence>/;
const modalMatch = kidContent.match(modalRegex);

if (modalMatch) {
  const modalUI = modalMatch[0];
  
  // Replace handleOpenChest reference since it's in KidDashboard
  // Wait, handleOpenChest gives points. It should also be available in App.tsx or we just use a helper function.
  // Actually, handleOpenChest is in KidDashboard, we can just copy it to App.tsx!
  const chestLogic = `
  const handleOpenChest = async (notification: any) => {
    if (!notification.chestPoints) return;
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
    showAlert("ОТКРЫТ СУНДУК! 🎉", \`Вы получили \${notification.chestPoints} монет из сундука!\`);
  };
  `;
  
  appContent = appContent.replace(
    /const handleLogout = \(\) => \{/,
    chestLogic + '\n\n  const handleLogout = () => {'
  );

  // Instead of myNotifications in the modal, we use `notifications.filter(n => n.kidId === currentUser?.id)`
  let updatedModal = modalUI.replace(/myNotifications/g, `notifications.filter(n => n.kidId === currentUser.id)`);
  
  appContent = appContent.replace(
    /<\/main>/,
    updatedModal + '\n      </main>'
  );
  
  // Remove modal and button from KidDashboard
  kidContent = kidContent.replace(modalRegex, '');
  kidContent = kidContent.replace(/<button[\s\S]+?handleOpenNotifications[\s\S]+?<\/button>/, '');
  
  // Remove handleOpenNotifications and isNotificationsOpen from KidDashboard
  kidContent = kidContent.replace(/const \[isNotificationsOpen, setIsNotificationsOpen\] = useState\(false\);/, '');
  kidContent = kidContent.replace(/const handleOpenNotifications = async \(\) => \{[\s\S]+?^\s+\};\n/m, '');
  kidContent = kidContent.replace(/const handleOpenChest = async \(notification\) => \{[\s\S]+?^\s+\};\n/m, '');
  
  fs.writeFileSync('src/App.tsx', appContent);
  fs.writeFileSync('src/components/KidDashboard.tsx', kidContent);
  console.log("Moved notifications");
} else {
  console.log("Could not find modal in KidDashboard");
}
