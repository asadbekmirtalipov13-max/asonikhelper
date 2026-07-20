import re

with open('src/components/KidDashboard.tsx', 'r') as f:
    content = f.read()

old_decline = """            if (newAssignedTo.length === 0) {
              await updateDoc(choreRef, {
                status: "declined",
                assignedTo: newAssignedTo
              });
            } else {"""

new_decline = """            if (newAssignedTo.length === 0) {
              await deleteDoc(choreRef);
            } else {"""

content = content.replace(old_decline, new_decline)

if "deleteDoc" not in content:
    content = content.replace('updateDoc, setDoc', 'updateDoc, setDoc, deleteDoc')

with open('src/components/KidDashboard.tsx', 'w') as f:
    f.write(content)
