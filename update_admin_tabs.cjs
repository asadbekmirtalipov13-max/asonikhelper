const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const tabsRegex = /<button\n\s*onClick=\{\(\) => setActiveTab\("categories"\)\}[\s\S]+?Категории\n\s*<\/button>/;

const tabsMatch = content.match(tabsRegex);
if (tabsMatch) {
  content = content.replace(
    tabsRegex,
    `${tabsMatch[0]}
        <button
          onClick={() => setActiveTab("notifications")}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 \${
            activeTab === "notifications"
              ? \`\${palette.bg} text-white shadow-sm\`
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }\`}
        >
          <Bell className="w-3.5 h-3.5" />
          Уведомления и Сундуки
        </button>
        <button
          onClick={() => setActiveTab("faq")}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 \${
            activeTab === "faq"
              ? \`\${palette.bg} text-white shadow-sm\`
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }\`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          FAQ
        </button>
        <button
          onClick={() => setActiveTab("promo")}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 \${
            activeTab === "promo"
              ? \`\${palette.bg} text-white shadow-sm\`
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }\`}
        >
          <Ticket className="w-3.5 h-3.5" />
          Промокоды
        </button>
        <button
          onClick={() => setActiveTab("achievements")}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 \${
            activeTab === "achievements"
              ? \`\${palette.bg} text-white shadow-sm\`
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }\`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Достижения
        </button>
`
  );
}

fs.writeFileSync('src/components/AdminPanel.tsx', content);
