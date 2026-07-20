const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<button\n\s*onClick=\{\(\) => handleOpenChest\(n\)\}\n\s*className="mt-2 w-full py-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-\[10px\] rounded-xl shadow-sm hover:shadow-md hover:scale-\[1\.02\] transition-all flex items-center justify-center gap-1 cursor-pointer"\n\s*>\n\s*<Sparkles className="w-3 h-3" \/> Открыть Сундук!\n\s*<\/button>/;

const replacement = `<button
                            onClick={() => handleOpenChest(n)}
                            disabled={chestIsOpening}
                            className={\`mt-2 w-full py-2 \${chestIsOpening ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-amber-400 to-orange-500 text-white hover:shadow-md hover:scale-[1.02] cursor-pointer'} font-black text-[10px] rounded-xl shadow-sm transition-all flex items-center justify-center gap-1\`}
                          >
                            <Sparkles className="w-3 h-3" /> {chestIsOpening ? 'Открываем...' : 'Открыть Сундук!'}
                          </button>`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/App.tsx', content);
