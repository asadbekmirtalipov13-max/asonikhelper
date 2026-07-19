const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const lines = content.split('\n');
const fixedLines = [];

for (let i = 0; i < lines.length; i++) {
  if (i >= 1790 && i <= 1795) { // 1791 to 1796 in 1-indexed
    continue;
  }
  if (i === 1796) {
    fixedLines.push('              </div>'); // closes space-y-3 (FAQ list)
    fixedLines.push('            </div>'); // closes FAQ section
    fixedLines.push('          </div>'); // closes max-w-2xl
    fixedLines.push('        </div>'); // closes space-y-6
    fixedLines.push('      )}');
  }
  fixedLines.push(lines[i]);
}

fs.writeFileSync('src/components/KidDashboard.tsx', fixedLines.join('\n'));
