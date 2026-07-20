const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(/const \[rpsChoice, setRpsChoice\] = useState<"rock"[\s\S]+?null>\(null\);/, 
'const [rpsChoice, setRpsChoice] = useState<"rock" | "paper" | "scissors" | null>(null);\n  const [activeGame, setActiveGame] = useState<"rps" | "coin" | null>(null);\n  const [gameBet, setGameBet] = useState(10);');

fs.writeFileSync('src/components/KidDashboard.tsx', content);
