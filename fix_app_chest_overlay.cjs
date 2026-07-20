const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /\{\/\* Custom Alert\/Confirm Modal Overlay \*\/\}/;

const replacement = `{openingChest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.8, rotate: -5 }}
            animate={{ scale: [0.8, 1.1, 1], rotate: [-5, 5, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
            className="text-8xl mb-6 select-none drop-shadow-2xl"
          >
            🎁
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl font-black text-white text-center"
          >
            Открываем сундук...
          </motion.h2>
          <p className="text-white/60 font-medium mt-2">Пожалуйста, подождите!</p>
        </div>
      )}

      {/* Custom Alert/Confirm Modal Overlay */}`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', content);
