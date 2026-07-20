const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /\{\["🦊", "🦁", "🐯", "🐼", "🐨", "🐻", "🐶", "🐱", "🐰", "🐵", "🐸", "🐷", "🦖", "🦄", "🐙", "🦀", "🐝", "🦋", "🍄", "🌻", "🌈", "🍕", "🍔", "🍦"\]\.map/g;
const replacement = `{["🦊", "🦁", "🐯", "🐼", "🦄", "🦖", "🐙", "🤖", "👾", "👽", "👻", "🤡", "🦸", "🦹", "🧙", "🧛", "🧜", "🧞", "🧟", "🚀", "🛸", "🚁", "🚗", "🏎️", "⚽", "🏀", "🏈", "🎮", "🕹️", "🎸", "💎", "🔮", "🔥", "⚡", "🌟"].map`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
