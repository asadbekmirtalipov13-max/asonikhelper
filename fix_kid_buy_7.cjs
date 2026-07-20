const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /<button\n\s*onClick=\{\(\) => \{\n\s*if \(\!loading\) \{\n\s*handleBuyItem\(\);\n\s*\}\n\s*\}\}\n\s*disabled=\{loading\}\n\s*className=\{\`flex-1 py-3 \$\{palette\.bg\} \$\{palette\.hover\} text-white font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50\`\}\n\s*>\n\s*Купить! 🚀\n\s*<\/button>/;

const replacement = `<button
                  onClick={() => {
                    if (!loading) {
                      handleBuyItem();
                    }
                  }}
                  disabled={loading}
                  className={\`flex-1 py-3 \${palette.bg} \${palette.hover} text-white font-bold rounded-2xl text-xs transition-all shadow-sm \${loading ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}\`}
                >
                  {loading ? 'Обработка...' : 'Купить! 🚀'}
                </button>`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
