const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const dailyTabRegex = /<button[\s\S]+?setActiveTab\("daily"\)[\s\S]+?Ежедневная Отметка\s*<\/button>/;

const dailyMatch = content.match(dailyTabRegex);
if (dailyMatch) {
  content = content.replace(
    dailyTabRegex,
    `${dailyMatch[0]}
        <button
          onClick={() => setActiveTab("profile")}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer \${
            activeTab === "profile"
              ? \`\${palette.bg} text-white shadow\`
              : "text-slate-600 hover:text-slate-900"
          }\`}
        >
          <User className="w-4 h-4" />
          Профиль / FAQ
        </button>`
  );
  fs.writeFileSync('src/components/KidDashboard.tsx', content);
}
