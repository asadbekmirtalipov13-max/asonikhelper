const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /<button\n\s*onClick=\{handleBuyItem\}\n\s*disabled=\{loading\}/;

const replacement = `<button
                  onClick={() => {
                    if (!loading) {
                      handleBuyItem();
                    }
                  }}
                  disabled={loading}`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
