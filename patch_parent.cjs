const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

content = content.replace(
  /const \[choreExecutionLimit, setChoreExecutionLimit\] = useState\(60\);/,
  "const [choreExecutionLimit, setChoreExecutionLimit] = useState(60);\n  const [choreUrgent, setChoreUrgent] = useState(false);"
);

content = content.replace(
  /const newChore: Chore = \{\n\s+id: choreId,\n\s+title: choreTitle\.trim\(\),\n\s+description: choreDesc\.trim\(\),\n\s+points: Number\(chorePoints\),/,
  `const isUrgent = choreUrgent;
        const finalPoints = isUrgent ? Number(chorePoints) * 2 : Number(chorePoints);
        const finalLimit = isUrgent ? Math.max(1, Math.floor(choreExecutionLimit / 2)) : choreExecutionLimit;

        const newChore: Chore = {
          id: choreId,
          title: choreTitle.trim(),
          description: choreDesc.trim(),
          points: finalPoints,
          executionLimitMinutes: finalLimit,
          isUrgent: isUrgent,`
);

content = content.replace(
  /executionLimitMinutes: Number\(choreExecutionLimit\)/,
  "// executionLimitMinutes already set above"
);

content = content.replace(
  /setChoreExecutionLimit\(60\);/,
  "setChoreExecutionLimit(60);\n      setChoreUrgent(false);"
);

content = content.replace(
  /<\/select>\n\s+<\/div>\n\n\s+<div>\n\s+<div className="flex justify-between items-center mb-1\.5">\n\s+<label className="block text-\[10px\] font-bold text-slate-400 uppercase">Кому поручить задание\?<\/label>/,
  `</select>
              </div>

              <div className="flex items-center gap-2 mt-2 bg-rose-50 p-3 rounded-xl border border-rose-100">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={choreUrgent}
                  onChange={(e) => setChoreUrgent(e.target.checked)}
                  className="w-4 h-4 text-rose-500 rounded focus:ring-rose-500 cursor-pointer accent-rose-500"
                />
                <label htmlFor="urgent" className="text-xs font-black text-rose-600 uppercase cursor-pointer select-none">
                  ⚡ Срочное задание (Награда X2, Время /2)
                </label>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Кому поручить задание?</label>`
);

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
