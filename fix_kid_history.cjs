const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const historyButtonRegex = /<button \n\s*onClick=\{\(\) => setActiveTab\("profile"\)\}\n\s*className="p-2 bg-black\/10 hover:bg-black\/20 rounded-xl transition-colors cursor-pointer"\n\s*title="История операций"\n\s*>\n\s*<RefreshCw className="w-5 h-5 text-white\/90" \/>\n\s*<\/button>/;

content = content.replace(historyButtonRegex, `<button 
              onClick={() => setActiveTab("history")}
              className={\`p-2 rounded-xl transition-colors cursor-pointer \${activeTab === "history" ? "bg-white/20" : "bg-black/10 hover:bg-black/20"}\`}
              title="История операций"
            >
              <RotateCcw className="w-5 h-5 text-white/90" />
            </button>`);

// Extract History Log from Profile and create activeTab === "history"
const profileHistoryRegex = /\{\/\* Transaction History Log \*\/\}([\s\S]+?)<\/div>\n\s*<\/div>\n\s*\)\}/;

const historyContentMatch = content.match(profileHistoryRegex);
if (historyContentMatch) {
  content = content.replace(historyContentMatch[0], `</div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6">
          {/* Transaction History Log */}
${historyContentMatch[1].replace(/ max-h-80 overflow-y-auto/g, '')}
        </div>
      )}`);
}

fs.writeFileSync('src/components/KidDashboard.tsx', content);
