const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/const \[notifChestCount, setNotifChestCount\] = useState\(1\);/g, 'const [notifChestPoints, setNotifChestPoints] = useState(10);');
content = content.replace(/value={notifChestCount}/g, 'value={notifChestPoints}');
content = content.replace(/onChange={\(e\) => setNotifChestCount/g, 'onChange={(e) => setNotifChestPoints');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
