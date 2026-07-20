const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

content = content.replace(/const \[chorePoints, setChorePoints\] = useState\(1\);/g, 'const [chorePoints, setChorePoints] = useState(10);');

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
