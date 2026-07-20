const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// Header balance card animation
content = content.replace(/<div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl/g, 
  `<motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl`);
content = content.replace(/<\/div>\n\s*\{\/\* MAIN CONTENT TABS \*\/\}/g, `</motion.div>
      {/* MAIN CONTENT TABS */}`);

// Tabs animation
content = content.replace(/<button\n\s*key=\{tab\.id\}\n\s*onClick=\{\(\) => setActiveTab\(tab\.id as any\)\}/g,
  `<motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}`);
content = content.replace(/<\/button>\n\s*\)\}\n\s*<\/div>\n\s*<\/div>\n\s*\{\/\* TAB CONTENT \*\/\}/g, 
  `</motion.button>
          )}
        </div>
      </div>
      {/* TAB CONTENT */}`);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
