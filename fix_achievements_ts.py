import re

with open('src/achievements.ts', 'r') as f:
    content = f.read()

# Replace updateDoc(userRef, updates) with setDoc(userRef, { achievements: { [achievementId]: { progress: newProgress, completed: isCompleted, completedAt: isCompleted ? new Date() : null, rewardClaimed: isCompleted ? false : null } } }, { merge: true })
old_logic = """    const updates: any = {
      [`achievements.${achievementId}.progress`]: newProgress,
      [`achievements.${achievementId}.completed`]: isCompleted
    };
    
    if (isCompleted) {
      updates[`achievements.${achievementId}.completedAt`] = new Date();
      updates[`achievements.${achievementId}.rewardClaimed`] = false;
    }
    
    await updateDoc(userRef, updates);"""

new_logic = """    const updates: any = {
      progress: newProgress,
      completed: isCompleted
    };
    
    if (isCompleted) {
      updates.completedAt = new Date();
      updates.rewardClaimed = false;
    }
    
    await setDoc(userRef, { achievements: { [achievementId]: updates } }, { merge: true });"""

content = content.replace(old_logic, new_logic)

# Also need to import setDoc if not already imported
if "setDoc" not in content:
    content = content.replace('updateDoc, collection', 'updateDoc, setDoc, collection')

with open('src/achievements.ts', 'w') as f:
    f.write(content)
