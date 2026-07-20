import re

with open('src/components/ParentDashboard.tsx', 'r') as f:
    content = f.read()

# State
content = content.replace('const [choreUrgent, setChoreUrgent] = useState(false);', 'const [choreUrgent, setChoreUrgent] = useState(false);\n  const [choreWeekly, setChoreWeekly] = useState(false);')

# Creation logic
old_new_chore = """        const newChore: Chore = {
          id: choreId,
          title: choreTitle.trim(),
          description: choreDesc.trim(),
          points: finalPoints,
          executionLimitMinutes: finalLimit,
          isUrgent: isUrgent,"""

new_new_chore = """        const newChore: Chore = {
          id: choreId,
          title: choreTitle.trim() + (choreWeekly ? " (Еженедельное)" : ""),
          description: choreDesc.trim(),
          points: finalPoints,
          executionLimitMinutes: finalLimit,
          isUrgent: isUrgent,
          isWeekly: choreWeekly,
          weeklyProgress: [],
          weeklyDaysLogged: 0,"""
content = content.replace(old_new_chore, new_new_chore)

# Reset form
content = content.replace('setChoreUrgent(false);', 'setChoreUrgent(false);\n          setChoreWeekly(false);')

# UI for checkbox
old_urgent_ui = """                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" checked={choreUrgent} onChange={e => setChoreUrgent(e.target.checked)} className="sr-only" />
                    <div className={`w-12 h-6 rounded-full transition-colors ${choreUrgent ? 'bg-rose-500' : 'bg-slate-200'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${choreUrgent ? 'translate-x-6' : ''}`}></div>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-rose-600 block">СРОЧНО! 🔥 (Х2 Награда)</span>
                    <span className="text-[10px] text-slate-400 font-medium block">25 минут на выполнение</span>
                  </div>
                </label>"""

new_urgent_ui = """                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" checked={choreUrgent} onChange={e => setChoreUrgent(e.target.checked)} className="sr-only" />
                    <div className={`w-12 h-6 rounded-full transition-colors ${choreUrgent ? 'bg-rose-500' : 'bg-slate-200'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${choreUrgent ? 'translate-x-6' : ''}`}></div>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-rose-600 block">СРОЧНО! 🔥 (Х2 Награда)</span>
                    <span className="text-[10px] text-slate-400 font-medium block">25 минут на выполнение</span>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group mt-4">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" checked={choreWeekly} onChange={e => setChoreWeekly(e.target.checked)} className="sr-only" />
                    <div className={`w-12 h-6 rounded-full transition-colors ${choreWeekly ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${choreWeekly ? 'translate-x-6' : ''}`}></div>
                  </div>
                  <div>
                    <span className="text-sm font-bold text-indigo-600 block">Еженедельное задание (7 дней)</span>
                    <span className="text-[10px] text-slate-400 font-medium block">Ребенок отправляет фото 7 дней подряд</span>
                  </div>
                </label>"""

content = content.replace(old_urgent_ui, new_urgent_ui)

with open('src/components/ParentDashboard.tsx', 'w') as f:
    f.write(content)
