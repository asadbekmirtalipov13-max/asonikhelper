const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/const \[internalActiveTab, setInternalActiveTab\] = useState<any>\("quests"\);/, 
'const [internalActiveTab, setInternalActiveTab] = useState<any>("quests");\n  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
