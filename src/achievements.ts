import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";
import { sendTelegramNotification } from "./utils/telegram";

export const ACHIEVEMENTS = [
  { id: "first_steps", title: "Начало всего", desc: "Сделать 3 задания", icon: "🌱", target: 3, reward: { points: 10 } },
  { id: "striker", title: "Страйкер", desc: "Заходить в игру 3 дня подряд", icon: "🔥", target: 3, reward: { points: 15 } },
  { id: "the_end", title: "Конец?!", desc: "Собрать 30 дней наград подряд", icon: "👑", target: 30, reward: { chest: true, points: 50 } },
  { id: "colonist", title: "Колонист!", desc: "За день сделать 3 задания", icon: "🚀", target: 3, reward: { chest: true } },
  { id: "easy_peasy", title: "Как нефиг делать", desc: "Сделать задание за 5 минут", icon: "⚡", target: 1, reward: { points: 5 } },
  { id: "stalker", title: "Сталкер", desc: "Сделать 20 заданий в сумме", icon: "🕵️", target: 20, reward: { points: 50 } },
  { id: "hacker", title: "Хакер", desc: "Активировать любой промокод", icon: "💻", target: 1, reward: { chest: true, points: 5 } },
  { id: "not_born", title: "Не рожден для этого 🥸", desc: "Принять но не выполнить задание", icon: "🥸", target: 1, reward: { points: 10 } }
];

export async function checkAchievement(kidId: string, achievementId: string, amount: number = 1, settings?: any) {
  try {
    const userRef = doc(db, "users", kidId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;
    
    const user = userSnap.data();
    const achievements = user.achievements || {};
    
    const def = ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!def) return;
    
    const current = achievements[achievementId] || { progress: 0, completed: false };
    if (current.completed) return; // Already done
    
    const newProgress = Math.min(def.target, current.progress + amount);
    const isCompleted = newProgress >= def.target;
    
    const updates: any = {
      progress: newProgress,
      completed: isCompleted
    };
    
    if (isCompleted) {
      updates.completedAt = new Date();
      updates.rewardClaimed = false;
    }
    
    await setDoc(userRef, { achievements: { [achievementId]: updates } }, { merge: true });
    
    if (isCompleted) {
      // Notify
      await addDoc(collection(db, "notifications"), {
        kidId: kidId,
        type: "system",
        title: `🏆 Достижение разблокировано: ${def.title}!`,
        text: `Зайдите в раздел Достижения, чтобы забрать награду.`,
        createdAt: new Date(),
        read: false
      });
      
      if (settings?.telegramChatId) {
        await sendTelegramNotification(
          `🏆 <b>Новое достижение!</b>\nУ ${user.name} новое достижение: <b>${def.title}</b>!`,
          settings.telegramChatId
        );
      }
    }
  } catch (err) {
    console.error("Error checking achievement:", err);
  }
}
