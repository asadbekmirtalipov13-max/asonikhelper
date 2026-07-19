const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

content = content.replace(
  /const \[transferTargetId, setTransferTargetId\] = useState\(""\);/,
  `const [transferTargetId, setTransferTargetId] = useState("");
  const [timeLeftToNextDay, setTimeLeftToNextDay] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const gmt5Now = new Date(new Date().getTime() + 5 * 60 * 60 * 1000);
      const nextMidnight = new Date(gmt5Now);
      nextMidnight.setUTCHours(24, 0, 0, 0); // Next midnight in GMT+5
      const diff = nextMidnight.getTime() - gmt5Now.getTime();
      
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      setTimeLeftToNextDay(\`\${hours.toString().padStart(2, '0')}:\${minutes.toString().padStart(2, '0')}:\${seconds.toString().padStart(2, '0')}\`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);`
);

content = content.replace(
  /\{canClaimDaily \? \`Забрать: \+\$\{pointsToEarnToday\} 🪙 монет!\` : "Сегодня пройдено!"\}/,
  "{canClaimDaily ? `Забрать: +${pointsToEarnToday} 🪙 монет!` : `Жди новый день: ${timeLeftToNextDay}`}"
);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
