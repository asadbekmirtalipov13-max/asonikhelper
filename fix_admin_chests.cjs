const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const regex = /for \(const kid of targets\) \{\n\s*const notifRef = doc\(collection\(db, "notifications"\)\);\n\s*batch\.set\(notifRef, \{\n\s*kidId: kid\.id,\n\s*type: notifType,\n\s*title: notifType === "chest" \? "🎁 Вам отправлен СУНДУК!" : "💬 Сообщение от родителей",\n\s*text: notifText\.trim\(\) \|\| \(notifType === "chest" \? "Откройте сундук, чтобы забрать монеты!" : ""\),\n\s*chestPoints: notifType === "chest" \? Number\(notifChestPoints\) : 0,\n\s*createdAt: new Date\(\),\n\s*read: false\n\s*\}\);\n\s*\}/;

const replacement = `for (const kid of targets) {
        if (notifType === "chest") {
          const count = Math.max(1, Math.min(10, Number(notifChestPoints)));
          for (let i = 0; i < count; i++) {
            const notifRef = doc(collection(db, "notifications"));
            batch.set(notifRef, {
              kidId: kid.id,
              type: "chest",
              title: "🎁 Вам отправлен СУНДУК!",
              text: notifText.trim() || "Откройте сундук, чтобы забрать монеты!",
              chestPoints: 1, // Just to mark it as a valid chest
              createdAt: new Date(Date.now() + i * 1000), // Slightly stagger timestamps
              read: false
            });
          }
        } else {
          const notifRef = doc(collection(db, "notifications"));
          batch.set(notifRef, {
            kidId: kid.id,
            type: "message",
            title: "💬 Сообщение от родителей",
            text: notifText.trim(),
            createdAt: new Date(),
            read: false
          });
        }
      }`;

content = content.replace(regex, replacement);

const tgMsgRegex = /tgMsg \+= \`Подарок: 🎁 Сундук с \$\{notifChestPoints\} монетами!\\n\`;/;
content = content.replace(tgMsgRegex, 'tgMsg += `Подарок: 🎁 Сундуки (${notifChestPoints} шт.)!\\n`;');

fs.writeFileSync('src/components/AdminPanel.tsx', content);
