import re

with open('src/components/ParentDashboard.tsx', 'r') as f:
    content = f.read()

regex = r'<label className="block text-\[10px\] font-bold text-slate-400 uppercase">Время на выполнение</label>[\s\S]*?</select>'
new_input = """<label className="block text-[10px] font-bold text-slate-400 uppercase">Время на выполнение (минут)</label>
                <input
                  type="number"
                  min={1}
                  value={choreUrgent ? 25 : choreExecutionLimit}
                  disabled={choreUrgent}
                  onChange={(e) => setChoreExecutionLimit(Number(e.target.value))}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                />"""

content = re.sub(regex, new_input, content)

with open('src/components/ParentDashboard.tsx', 'w') as f:
    f.write(content)
