const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/<X, Send className="w-3\.5 h-3\.5" \/>/g, '<X className="w-3.5 h-3.5" />');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
