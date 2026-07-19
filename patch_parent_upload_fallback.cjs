const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

// For setItemImage
content = content.replace(
  /const uploadedUrl = await uploadImageToImgbb\(compressedBase64\);\n\s+if \(uploadedUrl\) \{\n\s+setItemImage\(uploadedUrl\);\n\s+showAlert\("Успешно 🎉", "Изображение успешно сжато и загружено на сервер!"\);\n\s+\} else \{\n\s+showAlert\("Ошибка", "Не удалось загрузить изображение\. Пожалуйста, попробуйте еще раз\."\);\n\s+\}/,
  `const uploadedUrl = await uploadImageToImgbb(compressedBase64);
      if (uploadedUrl) {
        setItemImage(uploadedUrl);
        showAlert("Успешно 🎉", "Изображение успешно загружено на сервер!");
      } else {
        setItemImage(compressedBase64); // Fallback to base64
        showAlert("Предупреждение", "Загрузка на сервер не удалась, но изображение сохранено локально!");
      }`
);

// For setEditItemImage
content = content.replace(
  /const uploadedUrl = await uploadImageToImgbb\(compressedBase64\);\n\s+if \(uploadedUrl\) \{\n\s+setEditItemImage\(uploadedUrl\);\n\s+showAlert\("Успешно 🎉", "Изображение успешно сжато и загружено на сервер!"\);\n\s+\} else \{\n\s+showAlert\("Ошибка", "Не удалось загрузить изображение\. Пожалуйста, попробуйте еще раз\."\);\n\s+\}/,
  `const uploadedUrl = await uploadImageToImgbb(compressedBase64);
      if (uploadedUrl) {
        setEditItemImage(uploadedUrl);
        showAlert("Успешно 🎉", "Изображение успешно загружено на сервер!");
      } else {
        setEditItemImage(compressedBase64); // Fallback to base64
        showAlert("Предупреждение", "Загрузка на сервер не удалась, но изображение сохранено локально!");
      }`
);

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
