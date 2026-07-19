const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /const \[activeTab, setActiveTab\] = useState<any>\("quests"\);/;

const states = `const [activeTab, setActiveTab] = useState<any>("quests");
  
  // Games state
  const [rpsChoice, setRpsChoice] = useState<"rock" | "paper" | "scissors" | null>(null);
  const [rpsResult, setRpsResult] = useState<{player: string, bot: string, outcome: string, amount: number} | null>(null);
  const [rpsLoading, setRpsLoading] = useState(false);
  const [coinChoice, setCoinChoice] = useState<"heads" | "tails" | null>(null);
  const [coinResult, setCoinResult] = useState<{player: string, bot: string, outcome: string, amount: number} | null>(null);
  const [coinLoading, setCoinLoading] = useState(false);
`;

content = content.replace(regex, states);
fs.writeFileSync('src/components/KidDashboard.tsx', content);
