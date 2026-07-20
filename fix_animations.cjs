const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// Make store items motion.div
content = content.replace(/<div \n\s*key=\{item\.id\}\n\s*className=\{\`rounded-2xl sm:rounded-3xl p-2\.5 sm:p-5 flex flex-col justify-between/g, 
  `<motion.div 
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    key={item.id}
                    className={\`rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 flex flex-col justify-between`);

content = content.replace(/<\/div>\n\s*\);\n\s*\}\)/g, `</motion.div>
                );
              })`);

// Make chore items motion.div
content = content.replace(/<div \n\s*key=\{chore\.id\}\n\s*className=\{\`relative overflow-hidden bg-white/g,
  `<motion.div 
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      key={chore.id}
                      className={\`relative overflow-hidden bg-white`);

content = content.replace(/<\/div>\n\s*\)\}\n\s*<\/div>/g, `</motion.div>
                    )}
                  </div>`);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
