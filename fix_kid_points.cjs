const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /<div className="text-xl md:text-3xl font-black mt-0\.5 tracking-tight">🪙 \{currentUser\.points\}<\/div>/;

const replacement = `<div className="text-xl md:text-3xl font-black mt-0.5 tracking-tight relative flex items-center overflow-hidden">
                <AnimatePresence mode="popLayout">
                  <motion.div
                    key={currentUser.points}
                    initial={{ y: 20, opacity: 0, filter: "blur(4px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: -20, opacity: 0, filter: "blur(4px)" }}
                    transition={{ type: "spring", bounce: 0.5, duration: 0.5 }}
                  >
                    🪙 {currentUser.points}
                  </motion.div>
                </AnimatePresence>
              </div>`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
