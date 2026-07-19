const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /<div className="text-xl md:text-3xl font-black mt-0\.5 tracking-tight">🪙 \{currentUser\.points\}<\/div>\s*<\/div>\s*/;

content = content.replace(regex, `<div className="text-xl md:text-3xl font-black mt-0.5 tracking-tight">🪙 {currentUser.points}</div>
            </div>
            <button 
              onClick={() => setActiveTab("profile")}
              className="p-2 bg-black/10 hover:bg-black/20 rounded-xl transition-colors cursor-pointer"
              title="История операций"
            >
              <RefreshCw className="w-5 h-5 text-white/90" />
            </button>
          </div>
        </div>
`);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
