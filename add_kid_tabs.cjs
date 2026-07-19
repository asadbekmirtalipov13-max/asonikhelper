const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const dailyTabRegex = /<button[\s\S]+?setActiveTab\("daily"\)[\s\S]+?Ежедневная Отметка\n\s*\{canClaimDaily && \([\s\S]+?\}\n\s*<\/button>/;

const dailyMatch = content.match(dailyTabRegex);
if (dailyMatch) {
  content = content.replace(
    dailyTabRegex,
    `${dailyMatch[0]}
        <button
          onClick={() => setActiveTab("achievements")}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer \${
            activeTab === "achievements"
              ? \`\${palette.bg} text-white shadow\`
              : "text-slate-600 hover:text-slate-900"
          }\`}
        >
          <Trophy className="w-4 h-4" />
          Достижения
        </button>
        <button
          onClick={() => setActiveTab("games")}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer \${
            activeTab === "games"
              ? \`\${palette.bg} text-white shadow\`
              : "text-slate-600 hover:text-slate-900"
          }\`}
        >
          <Gamepad2 className="w-4 h-4" />
          Игры
        </button>`
  );
  fs.writeFileSync('src/components/KidDashboard.tsx', content);
} else {
  console.log("Could not find daily tab in KidDashboard");
}
