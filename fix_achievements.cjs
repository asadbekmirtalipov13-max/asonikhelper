const fs = require('fs');
let parentContent = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

parentContent = parentContent.replace(
/const updates = \{\s*\[\`achievements\.\$\{ach\.id\}\.completed\`\]: !isCompleted,\s*\[\`achievements\.\$\{ach\.id\}\.progress\`\]: !isCompleted \? ach\.target : 0\s*\};\s*await updateDoc\(doc\(db, "users", kid\.id\), updates\);/,
\`const updates = {
  achievements: {
    [ach.id]: {
      completed: !isCompleted,
      progress: !isCompleted ? ach.target : 0
    }
  }
};
await setDoc(doc(db, "users", kid.id), updates, { merge: true });\`
);

fs.writeFileSync('src/components/ParentDashboard.tsx', parentContent);
