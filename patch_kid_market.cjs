const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// 1. Update sorting logic
content = content.replace(
  /\.sort\(\(a, b\) => \{\n\s+if \(a\.pinned !== b\.pinned\) return a\.pinned \? -1 : 1;/,
  `.sort((a, b) => {
      const isDiscounted = (item) => item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now());
      const aDisc = isDiscounted(a);
      const bDisc = isDiscounted(b);
      if (aDisc && !bDisc) return -1;
      if (!aDisc && bDisc) return 1;
      
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;`
);

// 2. Change the card styling
// Find the card rendering
// It starts with className="bg-white border border-slate-200/80 rounded-2xl ...
// We need to inject dynamic classes and the discount timer.

const cardReplaceOld = `className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 shadow-xs flex flex-col justify-between gap-2.5 sm:gap-4 hover:shadow-sm transition-all relative overflow-hidden"`;
const cardReplaceNew = `className={\`rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 flex flex-col justify-between gap-2.5 sm:gap-4 transition-all relative overflow-hidden \${
                      (item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now()))
                        ? "bg-rose-50 border-2 border-rose-500 shadow-md hover:shadow-rose-200" 
                        : "bg-white border border-slate-200/80 shadow-xs hover:shadow-sm"
                    }\`}`;
content = content.replace(cardReplaceOld, cardReplaceNew);

// 3. Find the discount label and replace it with better UI including time
const oldDiscountCode = `{item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now()) && (
                          <div className="absolute top-2 right-2 bg-rose-500 text-white font-black text-[10px] px-2 py-1 rounded-lg animate-pulse shadow-md border border-rose-400">
                            -{item.discountPercentage}% СКИДКА!
                          </div>
                        )}`;
const newDiscountCode = `{item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now()) && (
                          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                            <div className="bg-rose-600 text-white font-black text-[10px] sm:text-xs px-2 py-1 rounded-lg shadow-lg border-2 border-rose-400 transform rotate-3">
                              🔥 -{item.discountPercentage}% СКИДКА
                            </div>
                            <div className="bg-black/70 text-white font-bold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                              ⏳ До {new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).toLocaleString("ru-RU", {day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"})}
                            </div>
                          </div>
                        )}`;

// Since the oldDiscountCode might have exact spacing, we can just replace a chunk
content = content.replace(
  /\{item\.discountPercentage && item\.discountUntil[\s\S]+?СКИДКА![\s\S]+?<\/div>[\s\S]+?\}\)/,
  newDiscountCode
);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
