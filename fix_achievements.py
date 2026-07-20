import re

with open('src/components/ParentDashboard.tsx', 'r') as f:
    content = f.read()

old_code = r"""const updates = {
                                      [`achievements.${ach.id}.completed`]: !isCompleted,
                                      [`achievements.${ach.id}.progress`]: !isCompleted ? ach.target : 0
                                    };
                                    await updateDoc(doc(db, "users", kid.id), updates);"""

new_code = """const updates = { achievements: { [ach.id]: { completed: !isCompleted, progress: !isCompleted ? ach.target : 0 } } };
                                    await setDoc(doc(db, "users", kid.id), updates, { merge: true });"""

content = content.replace(old_code, new_code)
# Also try a regex if literal replace fails
content = re.sub(r'const updates = \{\s*\[`achievements\.\$\{ach\.id\}\.completed`\]: !isCompleted,\s*\[`achievements\.\$\{ach\.id\}\.progress`\]: !isCompleted \? ach\.target : 0\s*\};\s*await updateDoc\(doc\(db, "users", kid\.id\), updates\);', new_code, content)

with open('src/components/ParentDashboard.tsx', 'w') as f:
    f.write(content)
