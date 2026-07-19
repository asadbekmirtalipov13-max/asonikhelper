const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

content = content.replace(/showAlert\("Успешно", "Задание успешно создано и отправлено!"\);\n\s*setIsCreateChoreModalOpen\(false\);/, 
'setIsCreateChoreModalOpen(false);\n      showAlert("Успешно", "Задание успешно создано и отправлено!");');

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
