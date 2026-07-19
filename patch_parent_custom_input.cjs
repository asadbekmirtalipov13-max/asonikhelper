const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

content = content.replace(
  /<div className="text-\[10px\] text-slate-400 font-medium">\n\s+Списано: <span className="font-bold text-amber-600">🪙 \{pur\.points\} баллов<\/span>\n\s+<\/div>\n\s+<\/div>\n\s+<\/div>\n\n\s+\{pur\.status === "pending"/,
  `<div className="text-[10px] text-slate-400 font-medium">
                          Списано: <span className="font-bold text-amber-600">🪙 {pur.points} баллов</span>
                        </div>
                        {pur.customInput && (
                          <div className="mt-1.5 p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                            <span className="block text-[8px] font-black text-indigo-400 uppercase">Введенные данные:</span>
                            <span className="text-xs font-semibold text-slate-700">{pur.customInput}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {pur.status === "pending"`
);

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
