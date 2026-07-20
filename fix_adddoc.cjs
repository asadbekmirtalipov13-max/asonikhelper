const fs = require('fs');
let kidDashContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');
kidDashContent = kidDashContent.replace(/import \{ doc, updateDoc, setDoc, getDoc, collection \} from "firebase\/firestore";/, 'import { doc, updateDoc, setDoc, getDoc, collection, addDoc } from "firebase/firestore";');
fs.writeFileSync('src/components/KidDashboard.tsx', kidDashContent);
