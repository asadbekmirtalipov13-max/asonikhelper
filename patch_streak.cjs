const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(
  /const todayStr = now\.toISOString\(\)\.split\("T"\)\[0\]; \/\/ YYYY-MM-DD/,
  `// Use GMT+5 for date tracking
  const gmt5Now = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const todayStr = gmt5Now.toISOString().split("T")[0]; // YYYY-MM-DD`
);

content = content.replace(
  /const yesterday = new Date\(now\);\n\s+yesterday\.setDate\(yesterday\.getDate\(\) - 1\);\n\s+const yesterdayStr = yesterday\.toISOString\(\)\.split\("T"\)\[0\];/,
  `const yesterday = new Date(gmt5Now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().split("T")[0];`
);

content = content.replace(
  /const currentMonthStr = \`\$\{now\.getFullYear\(\)\}-\$\{String\(now\.getMonth\(\) \+ 1\)\.padStart\(2, "0"\)\}\`;/,
  "const currentMonthStr = `${gmt5Now.getFullYear()}-${String(gmt5Now.getMonth() + 1).padStart(2, '0')}`;"
);

content = content.replace(
  /const isFree = restoresUsed < 2;\n\s+const cost = isFree \? 0 : 200;\n\n\s+if \(!isFree && currentUser\.points < cost\) \{\n\s+showAlert\("Недостаточно монет 🪙", "У тебя нет 200 монет для платного восстановления серии\."\);\n\s+return;\n\s+\}/,
  `if (restoresUsed >= 5) {
      showAlert("Лимит исчерпан", "Вы исчерпали лимит в 5 восстановлений в этом месяце.");
      return;
    }

    const isFree = restoresUsed === 0;
    const cost = isFree ? 0 : 200 * Math.pow(2, restoresUsed - 1);

    if (currentUser.points < cost) {
      showAlert("Недостаточно монет 🪙", \`Восстановление стоит \${cost} монет. У вас недостаточно средств.\`);
      return;
    }`
);

content = content.replace(
  /if \(newStreak === 15 \|\| newStreak === 30\) \{/g,
  `if (newStreak === 15 || newStreak === 30 || newStreak === 29) {`
);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
