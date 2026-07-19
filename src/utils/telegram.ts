const TELEGRAM_BOT_TOKEN = (import.meta as any).env.VITE_TELEGRAM_BOT_TOKEN || "8911721160:AAFCoYH4rxpXiSZAenCNpmpbMbW8vDp5niA";

export async function sendTelegramNotification(message: string, chatId: string): Promise<boolean> {
  if (!chatId) return false;
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        chat_id: chatId,
        text: message,
        parse_mode: "HTML"
      })
    });
    const data = await response.json();
    return data.ok;
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
    return false;
  }
}

export async function fetchBotInfo(): Promise<{ username: string; first_name: string } | null> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
    const data = await response.json();
    if (data.ok && data.result) {
      return data.result;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch Telegram bot info:", error);
    return null;
  }
}

export interface TelegramUpdateChat {
  id: string;
  name: string;
  username: string;
  timestamp: number;
  lastMessage: string;
}

export async function fetchTelegramUpdates(): Promise<TelegramUpdateChat[]> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=50&allowed_updates=["message"]`);
    const data = await response.json();
    if (data.ok) {
      const chatsMap = new Map();
      for (const update of data.result) {
        if (update.message && update.message.chat) {
          const chat = update.message.chat;
          const from = update.message.from || {};
          const displayName = chat.type === "private" 
            ? `${from.first_name || ""} ${from.last_name || ""}`.trim() || from.username || `User ${chat.id}`
            : chat.title || `Group ${chat.id}`;
          
          chatsMap.set(chat.id, {
            id: chat.id.toString(),
            name: displayName,
            username: from.username || "",
            timestamp: update.message.date * 1000,
            lastMessage: update.message.text || ""
          });
        }
      }
      return Array.from(chatsMap.values());
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch Telegram updates:", error);
    return [];
  }
}
