const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className="text-\[9px\] text-slate-400 capitalize font-bold">\n\s*\{currentUser\.role === "admin" \? "Администратор" \: \n\s*currentUser\.role === "parent" \? "Родитель" \: \`Ребенок • 🪙 \$\{currentUser\.points\}\`\}\n\s*<\/div>/;

const replacement = `<div className="text-[9px] text-slate-400 capitalize font-bold flex items-center">
                  {currentUser.role === "admin" ? "Администратор" : 
                   currentUser.role === "parent" ? "Родитель" : (
                     <div className="flex items-center">
                       <span className="mr-1">Ребенок • 🪙</span>
                       <div className="relative inline-flex overflow-hidden">
                         <AnimatePresence mode="popLayout">
                           <motion.div
                             key={currentUser.points}
                             initial={{ y: -10, opacity: 0, filter: "blur(2px)" }}
                             animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                             exit={{ y: 10, opacity: 0, filter: "blur(2px)", position: "absolute" }}
                             transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                           >
                             {currentUser.points}
                           </motion.div>
                         </AnimatePresence>
                       </div>
                     </div>
                   )}
                </div>`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', content);
