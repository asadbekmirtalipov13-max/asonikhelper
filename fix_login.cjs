const fs = require('fs');
let content = fs.readFileSync('src/components/LoginScreen.tsx', 'utf8');

const backgroundStart = `<div className="min-h-screen bg-[#F4F7FE] flex flex-col items-center justify-center p-4">`;
const backgroundReplacement = `<div className="min-h-screen bg-gradient-to-br from-[#F4F7FE] to-[#E2E8F0] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-200/40 rounded-full blur-3xl mix-blend-multiply"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-200/40 rounded-full blur-3xl mix-blend-multiply"></div>
      <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-amber-200/40 rounded-full blur-3xl mix-blend-multiply"></div>
      
      {/* Floating Sparkles */}
      <motion.div 
        animate={{ y: [0, -15, 0], opacity: [0.5, 1, 0.5] }} 
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} 
        className="absolute top-[15%] left-[25%] text-2xl"
      >
        ✨
      </motion.div>
      <motion.div 
        animate={{ y: [0, -20, 0], opacity: [0.3, 0.8, 0.3] }} 
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} 
        className="absolute bottom-[25%] right-[20%] text-4xl"
      >
        ⭐️
      </motion.div>
      <motion.div 
        animate={{ y: [0, -10, 0], rotate: [0, 10, -10, 0] }} 
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }} 
        className="absolute top-[40%] right-[15%] text-3xl opacity-50"
      >
        🚀
      </motion.div>
`;

content = content.replace(backgroundStart, backgroundReplacement);

fs.writeFileSync('src/components/LoginScreen.tsx', content);
