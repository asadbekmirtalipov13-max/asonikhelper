const fs = require('fs');
let kidDashContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

kidDashContent = kidDashContent.replace(/const handleCancelActiveChore = async \(choreId: string, title: string\) => \{/, 
  'const handleCancelActiveChore = async (choreId: string, title: string) => {\n    await checkAchievement(currentUser.id, "not_born", 1, settings);');

fs.writeFileSync('src/components/KidDashboard.tsx', kidDashContent);
