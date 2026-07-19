import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const PORT = 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8911721160:AAFCoYH4rxpXiSZAenCNpmpbMbW8vDp5niA";
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || "88c6cd2b32b499fd1e7272926e44bc3d";

async function startServer() {
  const app = express();
  
  // Increase payload limit for base64 image uploads
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // API Route: Get Telegram Bot Info
  app.get("/api/telegram/bot-info", async (req, res) => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
      const data = await response.json();
      if (data.ok) {
        res.json({ success: true, bot: data.result });
      } else {
        res.status(400).json({ success: false, error: data.description });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route: Get Telegram Updates to automatically find Chat IDs
  app.get("/api/telegram/updates", async (req, res) => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?limit=50&allowed_updates=["message"]`);
      const data = await response.json();
      if (data.ok) {
        // Extract unique chats from recent messages
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
        res.json({ success: true, chats: Array.from(chatsMap.values()) });
      } else {
        res.status(400).json({ success: false, error: data.description });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route: Send Telegram Notification
  app.post("/api/telegram/send", async (req, res) => {
    const { message, chatId } = req.body;
    if (!message || !chatId) {
      return res.status(400).json({ success: false, error: "Missing message or chatId" });
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML"
        })
      });
      const data = await response.json();
      if (data.ok) {
        res.json({ success: true });
      } else {
        res.status(400).json({ success: false, error: data.description });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // API Route: Upload Image to IMGBB (proxies request to secure API Key)
  app.post("/api/upload", async (req, res) => {
    const { image } = req.body; // base64 string
    if (!image) {
      return res.status(400).json({ success: false, error: "Missing image data" });
    }

    try {
      // Clean base64 string from data prefix if it exists
      const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");

      // Send to IMGBB via application/x-www-form-urlencoded
      const formData = new URLSearchParams();
      formData.append("image", cleanBase64);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      });

      const data = await response.json();
      if (data.success) {
        res.json({ 
          success: true, 
          url: data.data.url, 
          displayUrl: data.data.display_url,
          deleteUrl: data.data.delete_url
        });
      } else {
        res.status(400).json({ success: false, error: data.error?.message || "IMGBB upload failed" });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
