const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(
  /const handleRestoreStreak = async \(\) => \{\n\s+if \(loading\) return;\n\n\s+const currentMonthStr = \`\$\{gmt5Now/,
  `const handleRestoreStreak = async () => {\n    if (loading) return;\n    const gmt5Now = new Date(new Date().getTime() + 5 * 60 * 60 * 1000);\n\n    const currentMonthStr = \`\${gmt5Now`
);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
