const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/<motion\.div\n\s*whileHover=\{\{ scale: 1\.01, x: 4 \}\}\n\s*whileTap=\{\{ scale: 0\.99 \}\}\n\s*initial=\{\{ opacity: 0, x: -20 \}\}\n\s*animate=\{\{ opacity: 1, x: 0 \}\}\n\s*transition=\{\{ type: "spring", stiffness: 400, damping: 25 \}\}\n\s*key=\{chore\.id\}\n\s*className=\{\`relative overflow-hidden bg-white/g,
  `<div \n                    key={chore.id}\n                    className={\`relative overflow-hidden bg-white`);

content = content.replace(/<motion\.div \n\s*whileHover=\{\{ scale: 1\.02, y: -4 \}\}\n\s*whileTap=\{\{ scale: 0\.98 \}\}\n\s*initial=\{\{ opacity: 0, y: 20 \}\}\n\s*animate=\{\{ opacity: 1, y: 0 \}\}\n\s*transition=\{\{ type: "spring", stiffness: 300, damping: 20 \}\}\n\s*key=\{item\.id\}\n\s*className=\{\`rounded-2xl sm:rounded-3xl p-2\.5 sm:p-5 flex flex-col justify-between/g,
  `<div \n                    key={item.id}\n                    className={\`rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 flex flex-col justify-between`);

content = content.replace(/<motion\.div\n\s*whileHover=\{\{ scale: 1\.01, y: -2 \}\}\n\s*whileTap=\{\{ scale: 0\.99 \}\}\n\s*initial=\{\{ opacity: 0, y: 10 \}\}\n\s*animate=\{\{ opacity: 1, y: 0 \}\}\n\s*transition=\{\{ type: "spring", stiffness: 300, damping: 20 \}\}\n\s*key=\{chore\.id\}\n\s*className=\{\`relative overflow-hidden bg-white border border-slate-200/g,
  `<div \n                    key={chore.id}\n                    className={\`relative overflow-hidden bg-white border border-slate-200`);

content = content.replace(/<\/motion\.div>\n\s*\);\n\s*\}\)/g, `</div>\n                );\n              })`);
content = content.replace(/<\/motion\.div>\n\s*\)\}\n\s*<\/div>\n\s*\{chore\.status === "pending" && \(/g, `</div>\n                    )}\n                  </div>\n                  {chore.status === "pending" && (`);

// There is one generic error replace that caused the main issue:
content = content.replace(/<\/motion\.div>\n\s*\)\}\n\s*<\/div>/g, `</div>\n                    )}\n                  </div>`);

// Tabs
content = content.replace(/<motion\.button\n\s*whileHover=\{\{ scale: 1\.05 \}\}\n\s*whileTap=\{\{ scale: 0\.95 \}\}\n\s*key=\{tab\.id\}\n\s*onClick=\{\(\) => setActiveTab\(tab\.id as any\)\}/g,
  `<button\n            key={tab.id}\n            onClick={() => setActiveTab(tab.id as any)}`);
content = content.replace(/<\/motion\.button>/g, `</button>`);

// Fix header
content = content.replace(/<motion\.div \n\s*initial=\{\{ opacity: 0, y: -20 \}\}\n\s*animate=\{\{ opacity: 1, y: 0 \}\}\n\s*transition=\{\{ type: "spring", stiffness: 300, damping: 20 \}\}\n\s*className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl/g,
  `<div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl`);

content = content.replace(/<\/motion\.div>\n\s*\{\/\* MAIN CONTENT TABS \*\/\}/g, `</div>\n      {/* MAIN CONTENT TABS */}`);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
