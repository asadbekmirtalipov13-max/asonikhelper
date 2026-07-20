const fs = require('fs');
let content = fs.readFileSync('src/components/ParentDashboard.tsx', 'utf8');

// The duplicate blocks start with // Check achievements and end with } catch (e) { console.error(e); }
// Let's use a regex to clean them up. But wait, I'll just restore the whole file from before these bad injections if they were recent, or I'll just write a script to remove the specific bad blocks.

// Wait, what does the block look like exactly?
const badBlock = /      \/\/ Check achievements\s*await checkAchievement\(kidId, "first_steps"[\s\S]*?\} catch \(e\) \{ console\.error\(e\); \}/g;

content = content.replace(badBlock, '');

fs.writeFileSync('src/components/ParentDashboard.tsx', content);
