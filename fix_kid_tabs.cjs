const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /\{\/\* Tabs \*\/\}\n\s*<div className="flex flex-wrap bg-slate-100 p-1\.5 rounded-2xl w-full">\n\s*<\/div>/;

const replacement = `{/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab("quests")}
          className={\`flex-1 min-w-[80px] py-2 px-3 rounded-xl font-bold text-[10px] sm:text-xs transition-all flex flex-col items-center gap-1 shadow-sm cursor-pointer \${activeTab === "quests" ? "bg-indigo-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}\`}
        >
          <Sparkles className="w-4 h-4" />
          Задания
        </button>
        <button
          onClick={() => setActiveTab("store")}
          className={\`flex-1 min-w-[80px] py-2 px-3 rounded-xl font-bold text-[10px] sm:text-xs transition-all flex flex-col items-center gap-1 shadow-sm cursor-pointer \${activeTab === "store" ? "bg-amber-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}\`}
        >
          <ShoppingBag className="w-4 h-4" />
          Магазин
        </button>
        <button
          onClick={() => setActiveTab("daily")}
          className={\`flex-1 min-w-[80px] py-2 px-3 rounded-xl font-bold text-[10px] sm:text-xs transition-all flex flex-col items-center gap-1 shadow-sm cursor-pointer \${activeTab === "daily" ? "bg-orange-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}\`}
        >
          <Flame className="w-4 h-4" />
          Серии
        </button>
        <button
          onClick={() => setActiveTab("games")}
          className={\`flex-1 min-w-[80px] py-2 px-3 rounded-xl font-bold text-[10px] sm:text-xs transition-all flex flex-col items-center gap-1 shadow-sm cursor-pointer \${activeTab === "games" ? "bg-rose-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}\`}
        >
          <Gamepad2 className="w-4 h-4" />
          Игры
        </button>
        <button
          onClick={() => setActiveTab("achievements")}
          className={\`flex-1 min-w-[80px] py-2 px-3 rounded-xl font-bold text-[10px] sm:text-xs transition-all flex flex-col items-center gap-1 shadow-sm cursor-pointer \${activeTab === "achievements" ? "bg-emerald-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}\`}
        >
          <Trophy className="w-4 h-4" />
          Награды
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={\`flex-1 min-w-[80px] py-2 px-3 rounded-xl font-bold text-[10px] sm:text-xs transition-all flex flex-col items-center gap-1 shadow-sm cursor-pointer \${activeTab === "profile" ? "bg-sky-500 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}\`}
        >
          <User className="w-4 h-4" />
          Профиль
        </button>
      </div>`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
