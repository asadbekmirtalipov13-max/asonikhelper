const fs = require('fs');

// 1. Fix types
let typesContent = fs.readFileSync('src/types.ts', 'utf8');
if (!typesContent.includes('giftedBy?: string;')) {
  typesContent = typesContent.replace(/issuedAt\?: any;/g, 'issuedAt?: any;\n  giftedBy?: string;\n  customInput?: string;');
  fs.writeFileSync('src/types.ts', typesContent);
}

// 2. Fix import in KidDashboard
let kidDashContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');
kidDashContent = kidDashContent.replace(/import \{ doc, updateDoc, setDoc, getDoc \} from "firebase\/firestore";/, 'import { doc, updateDoc, setDoc, getDoc, collection } from "firebase/firestore";');
fs.writeFileSync('src/components/KidDashboard.tsx', kidDashContent);

// 3. Fix ParentDashboard display
let parentDashContent = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');
parentDashContent = parentDashContent.replace(/<span>Купил: \{pur\.kidName\}<\/span>/g, 
`{pur.giftedBy ? (
                            <span>Подарок для {pur.kidName} (от {pur.giftedBy})</span>
                          ) : (
                            <span>Купил: {pur.kidName}</span>
                          )}`);
fs.writeFileSync('src/components/ParentDashboard.tsx', parentDashContent);

