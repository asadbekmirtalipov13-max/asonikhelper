const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /const \[currentView, setCurrentView\] = useState<"dashboard" \| "admin" \| "store">\("dashboard"\);\n  const \[isNotificationsOpen, setIsNotificationsOpen\] = useState\(false\);\| "admin">\("dashboard"\);/,
  'const [currentView, setCurrentView] = useState<"dashboard" | "admin" | "store">("dashboard");\n  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);'
);

fs.writeFileSync('src/App.tsx', content);
