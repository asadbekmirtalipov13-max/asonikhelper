const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const replacement = `                        )}
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm leading-tight truncate">{item.title}</h4>
                        <p className="text-slate-400 text-[10px] sm:text-xs line-clamp-2 leading-relaxed h-7 sm:h-8">{item.description || "Без описания"}</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-slate-50 pt-2 sm:pt-3">
                      <div className="flex items-center gap-1.5 font-black">
                        <span className="text-amber-500 text-base sm:text-lg">🪙</span>
                        <span className={\`text-sm sm:text-lg tracking-tight \${
                          (() => {
                            const isDiscounted = item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now());
                            return isDiscounted ? "text-rose-600 line-through decoration-rose-300 opacity-50" : "text-amber-600";
                          })()
                        }\`}>
                          {item.points}
                        </span>
                        {(() => {
                          const isDiscounted = item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now());
                          if (isDiscounted) {
                            const newPrice = Math.max(1, Math.floor(item.points * (1 - item.discountPercentage / 100)));
                            return <span className="text-rose-600 ml-1 font-extrabold bg-rose-100 px-1.5 py-0.5 rounded-md">🪙 {newPrice}</span>
                          }
                          return null;
                        })()}
                      </div>
                      
                      <button
                        onClick={() => setConfirmPurchaseItem(item)}
                        className={\`w-full sm:w-auto py-1.5 sm:py-2 px-2.5 sm:px-4 text-[10px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer \${
                          (() => {
                            const isDiscounted = item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now());
                            const finalPrice = isDiscounted ? Math.max(1, Math.floor(item.points * (1 - item.discountPercentage / 100))) : item.points;
                            return currentUser.points < finalPrice;
                          })()`;

content = content.replace(
  /\s*\}\)\(\)\s*\?\s*"bg-slate-100 text-slate-400 border border-slate-200\/50"/,
  replacement + '\n                            ? "bg-slate-100 text-slate-400 border border-slate-200/50"'
);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
