import re

with open('src/components/KidDashboard.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'import { AppNotification, Chore, FamilyUser, MarketItem, Purchase, SiteSettings, Transaction , getDocs, query, where } from "../types";',
    'import { AppNotification, Chore, FamilyUser, MarketItem, Purchase, SiteSettings, Transaction } from "../types";'
)

content = content.replace(
    'import { doc, updateDoc, setDoc, getDoc, collection, addDoc, increment } from "firebase/firestore";',
    'import { doc, updateDoc, setDoc, getDoc, collection, addDoc, increment, getDocs, query, where } from "firebase/firestore";'
)

with open('src/components/KidDashboard.tsx', 'w') as f:
    f.write(content)
