const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

content = content.replace(
  /const finalLimit = isUrgent \? Math\.max\(1, Math\.floor\(choreExecutionLimit \/ 2\)\) : choreExecutionLimit;/,
  `const finalLimit = isUrgent ? 25 : choreExecutionLimit;`
);

content = content.replace(
  /showAlert\("Успешно", "Задание успешно создано и отправлено!"\);/,
  `showAlert("Успешно", "Задание успешно создано и отправлено!");\n      setIsCreateChoreModalOpen(false);`
);

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
