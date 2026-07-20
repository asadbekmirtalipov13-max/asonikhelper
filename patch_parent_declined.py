import re

with open('src/components/ParentDashboard.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'chore\.status === "pending" \? "bg-amber-100 text-amber-700" :\s*chore\.status === "rejected" \? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"',
    'chore.status === "pending" ? "bg-amber-100 text-amber-700" : chore.status === "rejected" ? "bg-red-100 text-red-600" : chore.status === "declined" ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"',
    content
)

content = re.sub(
    r'\{chore\.status === "pending" \? "Ожидает" :\s*chore\.status === "rejected" \? "Доработка" : "Выполняется"\}',
    '{chore.status === "pending" ? "Ожидает" : chore.status === "rejected" ? "Доработка" : chore.status === "declined" ? "Отказ" : "Выполняется"}',
    content
)

with open('src/components/ParentDashboard.tsx', 'w') as f:
    f.write(content)
