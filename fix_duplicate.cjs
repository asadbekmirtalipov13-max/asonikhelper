const fs = require('fs');
let kidDashContent = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const regex = /const handleClaimAchievement = async \(achId: string\) => \{[\s\S]*?setLoading\(false\);\n  \};\n/g;
const matches = kidDashContent.match(regex);

if (matches && matches.length > 1) {
  // Replace the first occurrence with empty string to remove the duplicate
  kidDashContent = kidDashContent.replace(matches[0], '');
  fs.writeFileSync('src/components/KidDashboard.tsx', kidDashContent);
}
