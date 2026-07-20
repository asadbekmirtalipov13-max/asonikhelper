const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /<span className="text-xs font-extrabold text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">\n\s*🔥 \{currentUser\.dailyStreak\} дней подряд\n\s*<\/span>/;

const replacement = `<div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-orange-100 to-rose-50 border border-orange-200 rounded-full shadow-sm" title="Ваша серия выполнения заданий!">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1], rotate: [-5, 5, -5] }} 
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-orange-500 text-sm"
                    >
                      🔥
                    </motion.div>
                    <span className="text-xs font-black text-orange-800">
                      {currentUser.dailyStreak || 0} {
                        (currentUser.dailyStreak || 0) % 10 === 1 && (currentUser.dailyStreak || 0) % 100 !== 11 ? 'день' :
                        [2, 3, 4].includes((currentUser.dailyStreak || 0) % 10) && ![12, 13, 14].includes((currentUser.dailyStreak || 0) % 100) ? 'дня' : 'дней'
                      } подряд
                    </span>
                  </div>`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
