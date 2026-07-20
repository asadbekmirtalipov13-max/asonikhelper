const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const lines = content.split('\n');
const fixedLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('// Games state')) {
    fixedLines.push(lines[i]);
    fixedLines.push('  const [rpsChoice, setRpsChoice] = useState<"rock" | "paper" | "scissors" | null>(null);');
    fixedLines.push('  const [activeGame, setActiveGame] = useState<"rps" | "coin" | null>(null);');
    fixedLines.push('  const [gameBet, setGameBet] = useState(10);');
    skip = true;
  } else if (skip && lines[i].includes('const [rpsResult')) {
    skip = false;
    fixedLines.push(lines[i]);
  } else if (!skip) {
    fixedLines.push(lines[i]);
  }
}

fs.writeFileSync('src/components/KidDashboard.tsx', fixedLines.join('\n'));
