const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldSync = `        setCurrentUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            points: updatedUser.points,
            dailyStreak: updatedUser.dailyStreak,
            lastCheckIn: updatedUser.lastCheckIn,
            avatar: updatedUser.avatar,
            name: updatedUser.name
          };
        });`;

const newSync = `        setCurrentUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            ...updatedUser
          };
        });`;

content = content.replace(oldSync, newSync);
fs.writeFileSync('src/App.tsx', content);
