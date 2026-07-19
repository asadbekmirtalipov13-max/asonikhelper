const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const lines = content.split('\n');
const fixedLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  if (i >= 1791 && i <= 1797) { // from 1792 to 1798 in 1-indexed
    continue;
  }
  if (i === 1798) {
    fixedLines.push('              </div>'); // space-y-3
    fixedLines.push('            </div>'); // pt-4 (FAQ section)
    fixedLines.push('          </div>'); // inner content
    fixedLines.push('        </div>'); // outer wrap
    fixedLines.push('      )}');
  }
  fixedLines.push(lines[i]);
}

fs.writeFileSync('src/components/KidDashboard.tsx', fixedLines.join('\n'));
