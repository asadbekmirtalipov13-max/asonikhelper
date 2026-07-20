import re

with open('src/components/AdminPanel.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'import { doc, setDoc, updateDoc, deleteDoc, collection, getDocs, writeBatch } from "firebase/firestore";',
    'import { doc, setDoc, updateDoc, deleteDoc, collection, getDocs, getDoc, writeBatch } from "firebase/firestore";'
)

with open('src/components/AdminPanel.tsx', 'w') as f:
    f.write(content)
