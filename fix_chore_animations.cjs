const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// For quests
content = content.replace(/<div\n\s*key=\{chore\.id\}\n\s*className=\{\`relative overflow-hidden bg-white/g,
  `<motion.div
                      whileHover={{ scale: 1.01, x: 4 }}
                      whileTap={{ scale: 0.99 }}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      key={chore.id}
                      className={\`relative overflow-hidden bg-white`);

content = content.replace(/<\/div>\n\s*\)\}\n\s*<\/div>\n\s*\{chore\.status === "pending" && \(/g, `</motion.div>
                    )}
                  </div>
                  {chore.status === "pending" && (`);

// Let's just fix chore wrapping since it's a bit tricky with regex
content = content.replace(/<div\n\s*key=\{chore\.id\}\n\s*className=\{\`relative overflow-hidden bg-white border border-slate-200/g,
  `<motion.div
                    whileHover={{ scale: 1.01, y: -2 }}
                    whileTap={{ scale: 0.99 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    key={chore.id}
                    className={\`relative overflow-hidden bg-white border border-slate-200`);

// There is a </div> to replace for chore.id
// We should find where the map for chores ends.
// Wait, replacing </div> with </motion.div> automatically is risky. Let's just wrap it manually if needed, or leave it.

fs.writeFileSync('src/components/KidDashboard.tsx', content);
