const fs = require('fs');
let kidDashContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

// Add increment to imports
kidDashContent = kidDashContent.replace(/import \{ doc, updateDoc, setDoc, getDoc, collection, addDoc \} from "firebase\/firestore";/, 'import { doc, updateDoc, setDoc, getDoc, collection, addDoc, increment } from "firebase/firestore";');

// Replace gameBet * 2 with Math.floor(gameBet * 1.5)
kidDashContent = kidDashContent.replace(/gameBet \* 2/g, 'Math.floor(gameBet * 1.5)');

// Fix text description to match
kidDashContent = kidDashContent.replace(/Победа в игре \(Суефа\) - Удвоение!/g, 'Победа в игре (Суефа) - 1.5x!');
kidDashContent = kidDashContent.replace(/Победа в игре \(Орел или Решка\) - Удвоение!/g, 'Победа в игре (Орел или Решка) - 1.5x!');

fs.writeFileSync('src/components/KidDashboard.tsx', kidDashContent);
