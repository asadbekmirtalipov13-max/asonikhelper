const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

content = content.replace(/X className/g, 'X, Send className'); // Wait no.

content = content.replace(/import \{([\s\S]*?)X([\s\S]*?)\} from "lucide-react";/, 'import {$1X, Send$2} from "lucide-react";');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
