/**
 * Helper to send telegram notifications via the Express backend proxy.
 * This keeps the API key secure.
 */
export async function sendTelegramNotification(message: string, chatId: string): Promise<boolean> {
  if (!chatId) return false;
  try {
    const response = await fetch("/api/telegram/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message, chatId })
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Failed to send Telegram notification:", error);
    return false;
  }
}

/**
 * Fetches bot information to display on settings page.
 */
export async function fetchBotInfo(): Promise<{ username: string; first_name: string } | null> {
  try {
    const response = await fetch("/api/telegram/bot-info");
    const data = await response.json();
    if (data.success && data.bot) {
      return data.bot;
    }
    return null;
  } catch (error) {
    console.error("Failed to fetch Telegram bot info:", error);
    return null;
  }
}

/**
 * Fetches recent bot updates to automatically retrieve user chat IDs.
 */
export interface TelegramUpdateChat {
  id: string;
  name: string;
  username: string;
  timestamp: number;
  lastMessage: string;
}

export async function fetchTelegramUpdates(): Promise<TelegramUpdateChat[]> {
  try {
    const response = await fetch("/api/telegram/updates");
    const data = await response.json();
    if (data.success && data.chats) {
      return data.chats;
    }
    return [];
  } catch (error) {
    console.error("Failed to fetch Telegram updates:", error);
    return [];
  }
}
