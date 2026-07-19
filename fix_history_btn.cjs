const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// Remove small history button
content = content.replace(/<button\n\s*onClick=\{\(\) => setActiveTab\("history"\)\}\n\s*className=\{\`p-2 rounded-xl transition-colors cursor-pointer \$\{activeTab === "history" \? "bg-white\/20" : "bg-black\/10 hover:bg-black\/20"\}\`\}\n\s*title="История операций"\n\s*>\n\s*<RotateCcw className="w-5 h-5 text-white\/90" \/>\n\s*<\/button>/, '');

// Add history tab to main tabs
const addHistoryTabRegex = /<\/button>\n\s*<\/div>\n\s*\{\/\* KID MAIN VIEW \*\/\}/;
content = content.replace(addHistoryTabRegex, `</button>
        <button
          onClick={() => setActiveTab("history")}
          className={\`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer \${
            activeTab === "history"
              ? \`\${palette.bg} text-white shadow\`
              : "text-slate-600 hover:text-slate-900"
          }\`}
        >
          <RotateCcw className="w-4 h-4" />
          История
        </button>
      </div>

      {/* KID MAIN VIEW */}`);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
