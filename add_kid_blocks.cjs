const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const endOfFileRegex = /<\/div>\n\s*\);\n\}/;
const match = content.match(endOfFileRegex);

if (match) {
  content = content.replace(endOfFileRegex, `
      {/* ACHIEVEMENTS TAB */}
      {activeTab === "achievements" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
          <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-500 mb-1">Достижения</h3>
            <p className="text-slate-400 font-medium">Раздел находится в разработке...</p>
          </div>
        </div>
      )}

      {/* GAMES TAB */}
      {activeTab === "games" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
          <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
            <Gamepad2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-black text-slate-500 mb-1">Игры</h3>
            <p className="text-slate-400 font-medium">Раздел находится в разработке... Скоро здесь появятся Камень-Ножницы-Бумага и другие игры!</p>
          </div>
        </div>
      )}
    </div>
  );
}`);
  fs.writeFileSync('src/components/KidDashboard.tsx', content);
} else {
  console.log("Could not find end of file.");
}
