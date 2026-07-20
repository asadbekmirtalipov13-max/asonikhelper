import React, { useState, useEffect, useRef } from "react";
import { FamilyUser, SiteSettings } from "../types";
import { db } from "../firebase";
import { doc, setDoc, updateDoc, deleteDoc, collection, getDocs, getDoc, writeBatch } from "firebase/firestore";
import { 
  Users, Bot, Palette, Plus, Trash2, RefreshCw, Bell, Sparkles, HelpCircle, 
  Check, Save, ArrowRight, UserPlus, Settings2, Info, Compass, Pencil, Image, Upload, Tag, X, Send, Ticket, Trophy, Gift, Rocket
} from "lucide-react";
import { motion } from "motion/react";
import { 
  generateRandomNickname, getRandomAvatar, PRESET_AVATARS, 
  TAILWIND_COLOR_PALETTES, DEFAULT_CATEGORIES
} from "../presets";
import { fetchBotInfo, fetchTelegramUpdates, TelegramUpdateChat, sendTelegramNotification } from "../utils/telegram";
import { uploadImageToImgbb } from "../utils/upload";
import { ACHIEVEMENTS } from "../achievements";

interface AdminPanelProps {
  currentUser: any;
  users: FamilyUser[];
  settings: SiteSettings;
  onUpdateSettings: (newSettings: Partial<SiteSettings>) => void;
  primaryColor: keyof typeof TAILWIND_COLOR_PALETTES;
  showAlert: (title: string, message: string, image?: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}


const PromoManager = ({ db, showAlert, showConfirm }: { db: any, showAlert: any, showConfirm: any }) => {
  const [promos, setPromos] = React.useState<any[]>([]);
  const [marketItems, setMarketItems] = React.useState<any[]>([]);
  const [editingPromo, setEditingPromo] = React.useState<any | null>(null);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const promoSnap = await getDocs(collection(db, "promocodes"));
        setPromos(promoSnap.docs.map(d => d.data()));

        const marketSnap = await getDocs(collection(db, "marketplace"));
        setMarketItems(marketSnap.docs.map(d => d.data()));
      } catch(e) { console.error(e); }
    };
    fetchData();
  }, [db]);

  const handleCreate = async () => {
    const codeInput = document.getElementById("newPromoCode") as HTMLInputElement;
    const typeInput = document.getElementById("newPromoType") as HTMLSelectElement;
    const limitInput = document.getElementById("newPromoLimit") as HTMLInputElement;
    const pointsInput = document.getElementById("newPromoPoints") as HTMLInputElement;
    const productInput = document.getElementById("newPromoProduct") as HTMLSelectElement;

    const code = codeInput?.value?.trim().toUpperCase();
    const type = typeInput?.value;
    const limit = Number(limitInput?.value) || 1;
    const points = type === "coins" ? (Number(pointsInput?.value) || 0) : 0;
    const isChest = type === "chest";
    const productId = type === "product" ? (productInput?.value || "") : "";

    if (!code || limit <= 0) {
      showAlert("Ошибка", "Введите код и количество активаций");
      return;
    }
    
    if (points <= 0 && !isChest && !productId) {
      showAlert("Ошибка", "Промокод должен давать хотя бы монеты, сундук или товар.");
      return;
    }

    try {
      const docId = code; 
      
      const docSnap = await getDoc(doc(db, "promocodes", docId));
      if (docSnap.exists()) {
        showAlert("Ошибка", "Такой промокод уже существует!");
        return;
      }

      await setDoc(doc(db, "promocodes", docId), {
        id: docId,
        code: docId,
        points: points,
        chest: isChest,
        productId: productId,
        activationsLeft: limit,
        active: true,
        createdAt: new Date(),
        usedBy: []
      });
      
      codeInput.value = "";
      pointsInput.value = "10";
      limitInput.value = "1";
      productInput.value = "";
      
      showAlert("Успех", "Промокод успешно создан!");
      
      const newSnap = await getDocs(collection(db, "promocodes"));
      setPromos(newSnap.docs.map(d => d.data()));
    } catch(e) { 
      console.error(e); 
      showAlert("Ошибка", "Не удалось создать промокод");
    }
  };

  const handleUpdate = async () => {
    if (!editingPromo) return;
    try {
      await updateDoc(doc(db, "promocodes", editingPromo.id), {
        points: Number(editingPromo.points) || 0,
        chest: !!editingPromo.chest,
        productId: editingPromo.productId || "",
        activationsLeft: Number(editingPromo.activationsLeft) || 0
      });
      
      setEditingPromo(null);
      showAlert("Успешно", "Промокод обновлен!");
      
      const newSnap = await getDocs(collection(db, "promocodes"));
      setPromos(newSnap.docs.map(d => d.data()));
    } catch(e) {
      console.error(e);
      showAlert("Ошибка", "Не удалось обновить промокод");
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm("Удаление промокода", "Точно удалить промокод " + id + "?", async () => {
      await deleteDoc(doc(db, "promocodes", id));
      setPromos(prev => prev.filter(p => p.id !== id));
    });
  };

  return (
    <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Ticket className="w-6 h-6 text-indigo-500" />
          Промокоды
        </h2>
      </div>

      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h3 className="font-bold text-sm text-slate-800 mb-4">Создать новый промокод</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Код</label>
            <input type="text" id="newPromoCode" placeholder="GIFT2024" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold uppercase focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Активаций</label>
            <input type="number" id="newPromoLimit" defaultValue={1} min={1} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Тип награды</label>
            <select id="newPromoType" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" onChange={(e) => {
                document.getElementById("promoCoinsWrap")!.style.display = e.target.value === "coins" ? "block" : "none";
                document.getElementById("promoProductWrap")!.style.display = e.target.value === "product" ? "block" : "none";
            }}>
              <option value="coins">Монеты</option>
              <option value="chest">Сундук</option>
              <option value="product">Товар из магазина</option>
            </select>
          </div>
          
          <div id="promoCoinsWrap">
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Монеты</label>
            <input type="number" id="newPromoPoints" defaultValue={10} min={1} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          
          <div id="promoProductWrap" style={{display: 'none'}}>
            <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Товар</label>
            <select id="newPromoProduct" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
              {marketItems.map(item => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>
        </div>
        <button 
          onClick={handleCreate}
          className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
        >
          Создать промокод
        </button>
      </div>

      <div className="space-y-3">
        {promos.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
            Нет активных промокодов.
          </div>
        ) : (
          promos.map(promo => (
            <div key={promo.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-lg font-black text-indigo-600">{promo.code || promo.id}</span>
                  {(promo.points > 0 || promo.amount > 0) && (
                    <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md">+{promo.points || promo.amount} 🪙</span>
                  )}
                  {promo.chest && (
                    <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md">📦 Сундук</span>
                  )}
                  {promo.productId && marketItems.find(i => i.id === promo.productId) && (
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-md">
                      🛍 {marketItems.find(i => i.id === promo.productId)?.title}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">Осталось активаций: {promo.activationsLeft ?? (promo.active ? 'Безлимит' : 0)}</p>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Использований: {promo.usedBy?.length || 0}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingPromo(promo)}
                  className="p-2 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(promo.id)}
                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {editingPromo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-800">Редактировать промокод: {editingPromo.code}</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Осталось активаций</label>
                <input 
                  type="number" 
                  value={editingPromo.activationsLeft} 
                  onChange={(e) => setEditingPromo({...editingPromo, activationsLeft: Number(e.target.value)})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Награда: Монеты</label>
                <input 
                  type="number" 
                  value={editingPromo.points || 0} 
                  onChange={(e) => setEditingPromo({...editingPromo, points: Number(e.target.value)})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={!!editingPromo.chest} 
                    onChange={(e) => setEditingPromo({...editingPromo, chest: e.target.checked})}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-xs font-bold text-slate-700 uppercase">Награда: Сундук 📦</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Товар (ID)</label>
                <select 
                  value={editingPromo.productId || ""} 
                  onChange={(e) => setEditingPromo({...editingPromo, productId: e.target.value})}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                >
                  <option value="">Без товара</option>
                  {marketItems.map(item => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setEditingPromo(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl text-xs transition-all cursor-pointer">
                Отмена
              </button>
              <button onClick={handleUpdate} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-all shadow-md cursor-pointer">
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminPanel({ currentUser, users, settings, onUpdateSettings, primaryColor, showAlert, showConfirm }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"users" | "telegram" | "branding" | "system" | "notifications" | "faq" | "categories" | "promo" | "achievements" | "updates">("users");
  const [loading, setLoading] = useState(false);

  const [promoCodes, setPromoCodes] = useState<any[]>([]);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const snap = await getDocs(collection(db, "promocodes"));
        const p: any[] = [];
        snap.forEach(doc => p.push(doc.data()));
        setPromoCodes(p);
      } catch (err) {
        console.error("Error fetching promos:", err);
      }
    };
    if (activeTab === "promo") {
      fetchPromos();
    }
  }, [activeTab]);

  
  // Create user form state
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<"parent" | "kid">("kid");
  const [newUserAvatar, setNewUserAvatar] = useState("🦊");
  const [newUserEmail, setNewUserEmail] = useState(""); // optional for kids, needed for parents

  // Edit user modal state
  const [editingUser, setEditingUser] = useState<FamilyUser | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserAvatar, setEditUserAvatar] = useState("");
  const [editUserTelegram, setEditUserTelegram] = useState("");

  // Telegram helper state
  const [telegramLogs, setTelegramLogs] = useState<TelegramUpdateChat[]>([]);
  const [botUsername, setBotUsername] = useState("");
  const [customChatId, setCustomChatId] = useState(settings.telegramChatId || "");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [chestUploading, setChestUploading] = useState(false);
  
  const [faqs, setFaqs] = useState(settings.faqs || [
    { id: "1", question: "Как получить монеты?", answer: "Выполняйте квесты, которые выдают родители, и отмечайтесь каждый день в календаре!" }
  ]);
  
  const handleAddFaq = () => {
    setFaqs([...faqs, { id: Math.random().toString(), question: "Новый вопрос?", answer: "Ответ на вопрос..." }]);
  };
  
  const handleUpdateFaq = (id, field, value) => {
    setFaqs(faqs.map(f => f.id === id ? { ...f, [field]: value } : f));
  };
  
  const handleRemoveFaq = (id) => {
    setFaqs(faqs.filter(f => f.id !== id));
  };
  
  const handleSaveFaqs = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "settings", "global"), { faqs });
      onUpdateSettings({ faqs });
      showAlert("Сохранено", "FAQ успешно обновлен.");
    } catch(err) {
      showAlert("Ошибка", "Не удалось сохранить FAQ.");
    } finally {
      setLoading(false);
    }
  };

  
  const [notifTarget, setNotifTarget] = useState<string>("all");
  const [notifType, setNotifType] = useState<"message" | "chest">("message");
  const [notifText, setNotifText] = useState("");
  const [notifChestPoints, setNotifChestPoints] = useState(10);
  
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifText.trim() && notifType !== "chest") return;
    
    setLoading(true);
    try {
      const targets = notifTarget === "all" ? users.filter(u => u.role === "kid") : users.filter(u => u.id === notifTarget);
      if (targets.length === 0) {
         showAlert("Ошибка", "Нет детей для отправки!");
         setLoading(false);
         return;
      }
      
      const batch = writeBatch(db);
      
      for (const kid of targets) {
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
      }
      
      await batch.commit();
      
      if (settings.telegramChatId) {
        let tgMsg = `📢 <b>Новое уведомление детям!</b>\nКому: ${notifTarget === "all" ? "Всем детям" : targets[0].name}\n`;
        if (notifType === "chest") {
           tgMsg += `Подарок: 🎁 Сундуки (${notifChestPoints} шт.)!\n`;
        }
        if (notifText.trim()) {
           tgMsg += `Сообщение: <i>${notifText}</i>`;
        }
        await sendTelegramNotification(tgMsg, settings.telegramChatId);
      }
      
      showAlert("Успешно!", "Уведомления/сундуки отправлены!");
      setNotifText("");
    } catch(err) {
      console.error(err);
      showAlert("Ошибка", "Не удалось отправить: " + err);
    } finally {
      setLoading(false);
    }
  };

  const chestInputRef = useRef<HTMLInputElement>(null);

  const isPrimaryAdmin = currentUser.email?.toLowerCase() === "asadbekmirtalipov13@gmail.com";
  const palette = TAILWIND_COLOR_PALETTES[primaryColor] || TAILWIND_COLOR_PALETTES.indigo;

  // Fetch telegram details on mount
  useEffect(() => {
    async function loadTelegramData() {
      const info = await fetchBotInfo();
      if (info) {
        setBotUsername(info.username);
      }
      const updates = await fetchTelegramUpdates();
      setTelegramLogs(updates);
    }
    loadTelegramData();
  }, []);

  const handleRefreshUpdates = async () => {
    setLoading(true);
    const updates = await fetchTelegramUpdates();
    setTelegramLogs(updates);
    setLoading(false);
  };

  const handleGenerateRandomUser = () => {
    setNewUserName(generateRandomNickname());
    setNewUserAvatar(getRandomAvatar());
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    setLoading(true);
    try {
      const userId = "user-" + Math.random().toString(36).substr(2, 9);
      // Support custom kid emails or default placeholders
      const emailValue = newUserEmail.trim().toLowerCase() || `${userId}@family.local`;

      const newUser: FamilyUser = {
        id: userId,
        name: newUserName.trim(),
        email: emailValue,
        role: newUserRole,
        avatar: newUserAvatar,
        points: 0,
        createdAt: new Date(),
        createdBy: currentUser.id,
        dailyStreak: 0
      };

      await setDoc(doc(db, "users", userId), newUser);
      
      // Send telegram alert if configured
      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `👤 <b>Добавлен новый профиль!</b>\nРоль: ${newUserRole === "parent" ? "Родитель" : "Ребенок"}\nИмя: ${newUser.name} ${newUser.avatar}`,
          settings.telegramChatId
        );
      }

      // Reset form
      setNewUserName("");
      setNewUserEmail("");
      setNewUserAvatar("🦊");
    } catch (err) {
      console.error("Failed to create user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEditUser = (user: FamilyUser) => {
    setEditingUser(user);
    setEditUserName(user.name);
    setEditUserEmail(user.email && !user.email.endsWith("@family.local") ? user.email : "");
    setEditUserAvatar(user.avatar);
    setEditUserTelegram(user.telegramChatId || "");
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    try {
      const userRef = doc(db, "users", editingUser.id);
      const emailValue = editUserEmail.trim().toLowerCase() || `${editingUser.id}@family.local`;

      await updateDoc(userRef, {
        name: editUserName.trim(),
        avatar: editUserAvatar,
        email: emailValue,
        telegramChatId: editUserTelegram.trim()
      });

      showAlert("Успешно", "Профиль успешно сохранен!");
      setEditingUser(null);
    } catch (err) {
      console.error("Failed to update user:", err);
      showAlert("Ошибка", "Не удалось обновить профиль: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (id: string, name: string) => {
    showConfirm(
      "Удаление пользователя",
      `Вы уверены, что хотите удалить пользователя ${name}? Все данные и баллы будут стерты.`,
      async () => {
        try {
          await deleteDoc(doc(db, "users", id));
          if (settings.telegramChatId) {
            await sendTelegramNotification(
              `🗑️ <b>Пользователь удален!</b>\nИмя: ${name}`,
              settings.telegramChatId
            );
          }
        } catch (err) {
          console.error("Failed to delete user:", err);
          showAlert("Ошибка", "Не удалось удалить пользователя: " + err);
        }
      }
    );
  };

  const handleUpdatePoints = async (id: string, amount: number) => {
    try {
      const userRef = doc(db, "users", id);
      const user = users.find(u => u.id === id);
      if (!user) return;
      const newPoints = Math.max(0, user.points + amount);
      await updateDoc(userRef, { points: newPoints });
    } catch (err) {
      console.error("Failed to update points:", err);
    }
  };

  const handleSetExactPoints = async (id: string, amount: number) => {
    try {
      const userRef = doc(db, "users", id);
      const targetPoints = Math.max(0, amount);
      await updateDoc(userRef, { points: targetPoints });
    } catch (err) {
      console.error("Failed to set exact points:", err);
    }
  };

  const handleResetAllBalancesAndStreaks = async () => {
    showConfirm(
      "Сбросить серии и балансы",
      "Вы действительно хотите обнулить баланс монет и сбросить серии ежедневных отметок у ВСЕХ детей? Это действие необратимо.",
      async () => {
        setLoading(true);
        try {
          const batch = writeBatch(db);
          const kids = users.filter(u => u.role === "kid");
          for (const kid of kids) {
            const userRef = doc(db, "users", kid.id);
            batch.update(userRef, {
              points: 0,
              dailyStreak: 0,
              lastCheckIn: "",
              restoresUsedThisMonth: 0,
              lastRestoreMonth: ""
            });
          }
          await batch.commit();
          showAlert("Успешно", "Все балансы монет и серии ежедневных отметок у детей успешно сброшены! 🎉");
        } catch (err) {
          console.error("Failed to reset balances:", err);
          showAlert("Ошибка", "Не удалось сбросить балансы: " + err);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleClearOldChores = async () => {
    showConfirm(
      "Очистить старые задания",
      "Вы действительно хотите навсегда удалить все архивные и завершенные задания (выполненные и отмененные)? Это очистит списки и устранит возможные зависания.",
      async () => {
        setLoading(true);
        try {
          const choresSnap = await getDocs(collection(db, "chores"));
          const batch = writeBatch(db);
          let count = 0;
          choresSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.status === "approved" || data.status === "declined") {
              batch.delete(docSnap.ref);
              count++;
            }
          });
          if (count > 0) {
            await batch.commit();
            showAlert("Успешно 🎉", `Удалено ${count} архивных заданий!`);
          } else {
            showAlert("Инфо", "Архивных заданий для удаления не найдено.");
          }
        } catch (err) {
          console.error("Failed to clear old chores:", err);
          showAlert("Ошибка", "Не удалось очистить задания: " + err);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleClearAllSystemData = async () => {
    showConfirm(
      "ПОЛНАЯ ОЧИСТКА ВСЕХ ДАННЫХ",
      "ВНИМАНИЕ! Это действие полностью удалит ВСЕ задания (квесты), товары в маркете, историю покупок и обнулит всех пользователей (кроме текущего). Вы действительно хотите начать все с чистого листа?",
      async () => {
        setLoading(true);
        try {
          const batch = writeBatch(db);

          // 1. Delete all chores
          const choresSnap = await getDocs(collection(db, "chores"));
          choresSnap.forEach(docSnap => {
            batch.delete(docSnap.ref);
          });

          // 2. Delete all marketplace items
          const marketSnap = await getDocs(collection(db, "marketplace"));
          marketSnap.forEach(docSnap => {
            batch.delete(docSnap.ref);
          });

          // 3. Delete all purchase records
          const purchasesSnap = await getDocs(collection(db, "purchases"));
          purchasesSnap.forEach(docSnap => {
            batch.delete(docSnap.ref);
          });

          // 4. Reset or delete users (keep the current admin/parent user, clear points and streaks of any other kids/parents)
          for (const u of users) {
            if (u.id === currentUser.id) {
              continue;
            }
            if (u.role === "kid") {
              const uRef = doc(db, "users", u.id);
              batch.update(uRef, {
                points: 0,
                dailyStreak: 0,
                lastCheckIn: "",
                restoresUsedThisMonth: 0,
                lastRestoreMonth: ""
              });
            }
          }

          await batch.commit();
          showAlert("Успешно 🎉", "Все системные данные были полностью очищены и сброшены!");
        } catch (err) {
          console.error("Failed to clear system data:", err);
          showAlert("Ошибка", "Не удалось очистить данные: " + err);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleSaveTelegramConfig = async () => {
    try {
      setLoading(true);
      await onUpdateSettings({ telegramChatId: customChatId });
      showAlert("Успешно", "Настройки Telegram успешно сохранены!");
    } catch (err) {
      console.error("Failed to save telegram settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (cat: string) => {
    const trimmed = cat.trim();
    if (!trimmed) return;
    const currentCats = settings.categories || DEFAULT_CATEGORIES;
    if (currentCats.includes(trimmed)) {
      showAlert("Внимание", "Такая категория уже существует!");
      return;
    }
    const updated = [...currentCats, trimmed];
    await onUpdateSettings({ categories: updated });
    showAlert("Успешно", `Категория "${trimmed}" успешно добавлена! 🎉`);
  };

  const handleRemoveCategory = async (cat: string) => {
    const currentCats = settings.categories || DEFAULT_CATEGORIES;
    const updated = currentCats.filter(c => c !== cat);
    if (updated.length === 0) {
      showAlert("Ошибка", "Должна остаться хотя бы одна категория!");
      return;
    }
    showConfirm(
      "Удалить категорию",
      `Вы действительно хотите удалить категорию "${cat}"? Товары с этой категорией сохранятся, но категория перестанет отображаться в поиске.`,
      async () => {
        await onUpdateSettings({ categories: updated });
        showAlert("Успешно", "Категория удалена.");
      }
    );
  };

  const handleTestTelegram = async () => {
    if (!customChatId) return;
    setTestStatus("sending");
    const success = await sendTelegramNotification(
      `🔔 <b>Тестовое сообщение</b>\nСвязь между сайтом 🏪 и вашим Telegram-аккаунтом настроена успешно!`,
      customChatId
    );
    setTestStatus(success ? "success" : "error");
    setTimeout(() => setTestStatus("idle"), 4000);
  };

  const handleSelectSuggestedChat = (id: string) => {
    setCustomChatId(id);
  };

  const handleSelectPalette = async (key: string) => {
    await onUpdateSettings({ primaryColor: key as any });
  };

  const handleUpdateSiteTitle = async (title: string, logo: string) => {
    await onUpdateSettings({ title, logo });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert("Ошибка", "Изображение слишком большое! Максимальный размер 5МБ.");
      return;
    }

    setLogoUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Str = reader.result as string;
        const uploadedUrl = await uploadImageToImgbb(base64Str);
        if (uploadedUrl) {
          await onUpdateSettings({ logo: uploadedUrl });
          showAlert("Успешно", "Логотип сайта успешно обновлен! 🎉");
        } else {
          showAlert("Ошибка", "Не удалось загрузить изображение. Пожалуйста, попробуйте еще раз.");
        }
      } catch (err) {
        console.error("Failed to upload logo:", err);
        showAlert("Ошибка", "Произошла ошибка при загрузке картинки.");
      } finally {
        setLogoUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleChestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert("Ошибка", "Изображение слишком большое! Максимальный размер 5МБ.");
      return;
    }

    setChestUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Str = reader.result as string;
        const uploadedUrl = await uploadImageToImgbb(base64Str);
        if (uploadedUrl) {
          await onUpdateSettings({ chestImageUrl: uploadedUrl });
          showAlert("Успешно", "Изображение сундука успешно обновлено! 🎉");
        } else {
          showAlert("Ошибка", "Не удалось загрузить изображение. Пожалуйста, попробуйте еще раз.");
        }
      } catch (err) {
        console.error("Failed to upload chest image:", err);
        showAlert("Ошибка", "Произошла ошибка при загрузке картинки.");
      } finally {
        setChestUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const kidsList = users.filter(u => u.role === "kid");
  const parentsList = users.filter(u => u.role === "parent" || u.role === "admin");

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings2 className={`w-5 h-5 ${palette.text}`} />
            Админ-Панель Управления
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">
            {isPrimaryAdmin ? "Полный доступ суперадминистратора" : "Настройки семейной экосистемы"}
          </p>
        </div>
        <div className="text-xs bg-slate-100 font-bold px-3 py-1.5 rounded-full text-slate-600 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
          {currentUser.name}
        </div>
      </div>

      {/* Premium Family Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Treasury */}
        <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white rounded-3xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 text-7xl select-none opacity-15 group-hover:scale-110 transition-transform">🪙</div>
          <div>
            <div className="text-[9px] font-black text-amber-100 uppercase tracking-wider">Семейный Банк (Баланс)</div>
            <div className="text-xl font-black mt-1">🪙 99,999,999.99</div>
            <p className="text-[10px] text-amber-50/80 font-bold mt-1">Свободный баланс взрослых</p>
          </div>
        </div>

        {/* Kids card */}
        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-4 flex items-center justify-between shadow-xs relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 text-7xl select-none opacity-10 group-hover:scale-110 transition-transform">🧸</div>
          <div>
            <div className="text-[9px] font-black text-orange-800 uppercase tracking-wider">Дети в системе</div>
            <div className="text-xl font-black text-orange-700 mt-1">{kidsList.length} чел.</div>
            <p className="text-[10px] text-orange-500 font-bold mt-1">Зарегистрировано</p>
          </div>
        </div>

        {/* Parents card */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-4 flex items-center justify-between shadow-xs relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 text-7xl select-none opacity-10 group-hover:scale-110 transition-transform">👩</div>
          <div>
            <div className="text-[9px] font-black text-indigo-800 uppercase tracking-wider">Родители и Админы</div>
            <div className="text-xl font-black text-indigo-700 mt-1">{parentsList.length} чел.</div>
            <p className="text-[10px] text-indigo-500 font-bold mt-1">Доступ к управлению</p>
          </div>
        </div>
      </div>

      {/* Internal Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "users"
              ? `${palette.bg} text-white shadow-sm`
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Пользователи
        </button>

        <button
          onClick={() => setActiveTab("telegram")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "telegram"
              ? `${palette.bg} text-white shadow-sm`
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          Telegram Оповещения
        </button>

        {isPrimaryAdmin && (
          <button
            onClick={() => setActiveTab("branding")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "branding"
                ? `${palette.bg} text-white shadow-sm`
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Брендинг и Стиль
          </button>
        )}

        <button
          onClick={() => setActiveTab("system")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "system"
              ? `${palette.bg} text-white shadow-sm`
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          Сброс и Очистка
        </button>

        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "categories"
              ? `${palette.bg} text-white shadow-sm`
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          Категории
        </button>
        <button
          onClick={() => setActiveTab("notifications")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "notifications"
              ? `${palette.bg} text-white shadow-sm`
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          Уведомления и Сундуки
        </button>
        <button
          onClick={() => setActiveTab("faq")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "faq"
              ? `${palette.bg} text-white shadow-sm`
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          FAQ
        </button>
        <button
          onClick={() => setActiveTab("promo")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "promo"
              ? `${palette.bg} text-white shadow-sm`
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Ticket className="w-3.5 h-3.5" />
          Промокоды
        </button>
        <button
          onClick={() => setActiveTab("achievements")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === "achievements"
              ? `${palette.bg} text-white shadow-sm`
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          Достижения
        </button>

      </div>

      {/* USER MANAGEMENT TAB */}
      {activeTab === "users" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create user Form */}
          <div className="lg:col-span-1 p-5 bg-slate-50/50 rounded-3xl border border-slate-200 space-y-4">
            <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              Добавить члена семьи
            </h3>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Роль пользователя</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => { setNewUserRole("kid"); handleGenerateRandomUser(); }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      newUserRole === "kid"
                        ? `${palette.border} bg-white ${palette.text}`
                        : "border-slate-200 text-slate-500 hover:bg-white"
                    }`}
                  >
                    🧸 Сын / Ребенок
                  </button>
                  <button
                    type="button"
                    onClick={() => { setNewUserRole("parent"); setNewUserName(""); }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      newUserRole === "parent"
                        ? `${palette.border} bg-white ${palette.text}`
                        : "border-slate-200 text-slate-500 hover:bg-white"
                    }`}
                  >
                    👩 Мама / Папа
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Имя / Никнейм</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder={newUserRole === "kid" ? "ЛисенокНиндзя42" : "Мама Зухра"}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {newUserRole === "kid" && (
                    <button
                      type="button"
                      onClick={handleGenerateRandomUser}
                      className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-700 shadow-sm"
                      title="Рандомное имя и аватарка"
                    >
                      🎲
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {newUserRole === "parent" ? "Email (обязательно)" : "Google Email (необязательно, для безопасного входа)"}
                </label>
                <input
                  type="email"
                  required={newUserRole === "parent"}
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder={newUserRole === "parent" ? "mom@gmail.com" : "rasulbek@gmail.com"}
                  className="w-full mt-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Выбрать Аватарку</label>
                <div className="grid grid-cols-7 gap-1 bg-white p-2 rounded-xl border border-slate-200">
                  {PRESET_AVATARS.slice(0, 14).map((av) => (
                    <button
                      key={av.emoji}
                      type="button"
                      onClick={() => setNewUserAvatar(av.emoji)}
                      className={`text-xl p-1 rounded-lg hover:bg-slate-100 transition-all ${
                        newUserAvatar === av.emoji ? "bg-amber-100 scale-110 border border-amber-300" : ""
                      }`}
                    >
                      {av.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 px-4 ${palette.bg} ${palette.hover} text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer`}
              >
                Создать профиль
              </button>
            </form>
          </div>

          {/* Users lists */}
          <div className="lg:col-span-2 space-y-4">
            {/* Kids */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Дети в семье ({kidsList.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {kidsList.map((kid) => (
                  <div 
                    key={kid.id}
                    className="p-4 border border-slate-200 hover:border-slate-300 rounded-3xl bg-white flex items-center justify-between gap-2 shadow-sm relative group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                        {kid.avatar || "👦"}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          {kid.name}
                          <button
                            onClick={() => handleStartEditUser(kid)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                            title="Редактировать профиль"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Баланс: <span className="font-bold text-amber-600">🪙 {kid.points}</span> • Streak: 🔥 {kid.dailyStreak} дн.
                        </div>
                        {kid.email && !kid.email.endsWith("@family.local") && (
                          <div className="text-[9px] text-indigo-500 font-bold mt-0.5">
                            📧 {kid.email}
                          </div>
                        )}
                        {kid.telegramChatId && (
                          <div className="text-[9px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                            💬 Telegram ID: {kid.telegramChatId}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() => handleUpdatePoints(kid.id, 5)}
                          className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          title="Добавить 5 баллов"
                        >
                          +5
                        </button>
                        <button
                          onClick={() => handleUpdatePoints(kid.id, -5)}
                          className="px-2 py-1 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          title="Отнять 5 баллов"
                        >
                          -5
                        </button>

                        <div className="flex items-center gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50">
                          <input
                            type="number"
                            defaultValue={kid.points}
                            onBlur={async (e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val)) {
                                await handleSetExactPoints(kid.id, val);
                              }
                            }}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                const val = parseInt((e.target as HTMLInputElement).value);
                                if (!isNaN(val)) {
                                  await handleSetExactPoints(kid.id, val);
                                  (e.target as HTMLInputElement).blur();
                                }
                              }
                            }}
                            className="w-12 text-center bg-white border-0 text-[10px] font-black text-amber-700 focus:ring-1 focus:ring-indigo-500 rounded p-0.5"
                            title="Точный баланс монет"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(kid.id, kid.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all absolute top-2 right-2 opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Parents */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Родители и Админы ({parentsList.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {parentsList.map((parent) => (
                  <div 
                    key={parent.id}
                    className="p-4 border border-slate-200 hover:border-slate-300 rounded-3xl bg-white flex items-center justify-between gap-2 shadow-sm relative group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl bg-slate-50 p-2 rounded-xl border border-slate-200">
                        {parent.avatar || "👩"}
                      </span>
                      <div className="truncate">
                        <div className="font-bold text-slate-800 text-sm truncate flex items-center gap-1.5">
                          {parent.name}
                          {parent.role === "admin" && (
                            <span className="text-[9px] bg-red-100 text-red-600 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              Админ
                            </span>
                          )}
                          <button
                            onClick={() => handleStartEditUser(parent)}
                            className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                            title="Редактировать профиль"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{parent.email}</div>
                      </div>
                    </div>

                    {isPrimaryAdmin && parent.id !== currentUser.id && (
                      <button
                        onClick={() => handleDeleteUser(parent.id, parent.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-all absolute top-2 right-2 opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Удалить родителей"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TELEGRAM NOTIFICATION SETTINGS */}
      {activeTab === "telegram" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
                <Bot className="w-4.5 h-4.5 text-sky-500" />
                Настройка Telegram Бота
              </h3>

              <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>Бот отправляет уведомления родителям, когда ребенок отправляет отчет по квесту или покупает товар.</p>
                <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-700 flex items-center gap-1">
                    <span>1.</span> Найдите бота в Telegram:
                  </div>
                  <div className="bg-slate-50 py-1.5 px-3 rounded-lg font-mono text-xs text-indigo-600 font-bold break-all select-all flex justify-between items-center">
                    <span>@{botUsername || "Загрузка..."}</span>
                    <span className="text-[9px] bg-indigo-100 text-indigo-700 font-bold py-0.5 px-1.5 rounded uppercase">копировать</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-1">
                    Нажмите <b>/start</b>, чтобы активировать бота.
                  </div>
                </div>

                <div className="pt-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Telegram Chat ID получателя</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="text"
                      value={customChatId}
                      onChange={(e) => setCustomChatId(e.target.value)}
                      placeholder="123456789"
                      className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSaveTelegramConfig}
                      className={`p-2.5 ${palette.bg} ${palette.hover} text-white rounded-xl shadow-sm hover:shadow transition-all`}
                    >
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleTestTelegram}
                    disabled={!customChatId || testStatus === "sending"}
                    className="w-full py-2.5 border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-xl text-slate-600 hover:bg-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {testStatus === "sending" ? (
                      "Отправка теста..."
                    ) : testStatus === "success" ? (
                      <span className="text-emerald-600 flex items-center gap-1">✅ Тест успешно отправлен!</span>
                    ) : testStatus === "error" ? (
                      <span className="text-rose-500">❌ Ошибка отправки теста!</span>
                    ) : (
                      "🔔 Отправить тестовое сообщение"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Updates log */}
            <div className="p-5 bg-white rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-amber-500 animate-spin-slow" />
                  Авто-определение Chat ID
                </h3>
                <button
                  onClick={handleRefreshUpdates}
                  disabled={loading}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-all flex items-center gap-1 text-[10px] font-bold cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                  Обновить
                </button>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                Запустите бота на своем телефоне и напишите ему любое сообщение. Затем обновите этот список, чтобы увидеть свой Chat ID!
              </p>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {telegramLogs.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-[11px] text-slate-400">
                    Активность не обнаружена. Запустите бота и отправьте сообщение, затем нажмите кнопку Обновить.
                  </div>
                ) : (
                  telegramLogs.map((log) => (
                    <div 
                      key={log.id} 
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl text-xs flex justify-between items-center gap-2 transition-all"
                    >
                      <div>
                        <div className="font-bold text-slate-800">{log.name}</div>
                        <div className="text-[10px] text-slate-400">@{log.username || "нет_ника"} • ID: <span className="font-mono font-bold text-slate-600">{log.id}</span></div>
                        <div className="text-[10px] text-indigo-500 italic truncate max-w-[150px] mt-0.5">"{log.lastMessage}"</div>
                      </div>
                      <button
                        onClick={() => handleSelectSuggestedChat(log.id)}
                        className="py-1 px-2.5 bg-white hover:bg-indigo-50 text-indigo-600 border border-slate-200 hover:border-indigo-200 text-[10px] font-bold rounded-lg transition-all shadow-sm cursor-pointer"
                      >
                        Выбрать
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BRANDING AND STYLING TAB */}
      {activeTab === "branding" && isPrimaryAdmin && (
        <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-6">
          <h3 className="font-bold text-slate-700 text-sm flex items-center gap-2">
            <Palette className="w-4.5 h-4.5 text-pink-500" />
            Брендинг и Оформление Сайта
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title / Logo setup */}
            <div className="space-y-3 bg-white p-6 rounded-3xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Название и логотип</h4>
              
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase">Название сайта</label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => handleUpdateSiteTitle(e.target.value, settings.logo)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase">Логотип сайта (Иконка)</label>
                
                <div className="mt-2 flex items-center gap-4">
                  {/* Logo preview */}
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl overflow-hidden shadow-inner shrink-0">
                    {settings.logo && (settings.logo.startsWith("http") || settings.logo.startsWith("data:")) ? (
                      <img 
                        src={settings.logo} 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      settings.logo || "🤝"
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={settings.logo && (settings.logo.startsWith("http") || settings.logo.startsWith("data:")) ? "" : settings.logo}
                        onChange={(e) => handleUpdateSiteTitle(settings.title, e.target.value)}
                        placeholder="Emoji"
                        className="w-20 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center font-bold text-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        title="Введите эмодзи-логотип"
                      />
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        disabled={logoUploading}
                        className={`px-3 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                          logoUploading ? "opacity-50" : ""
                        }`}
                      >
                        <Upload className="w-4 h-4 text-indigo-500" />
                        {logoUploading ? "Загрузка..." : "Свой логотип (Загрузить)"}
                      </button>
                    </div>
                    {settings.logo && (settings.logo.startsWith("http") || settings.logo.startsWith("data:")) ? (
                      <button
                        type="button"
                        onClick={() => handleUpdateSiteTitle(settings.title, "🏪")}
                        className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer block"
                      >
                        Сбросить на эмодзи 🏪
                      </button>
                    ) : (
                      <span className="text-[9px] text-slate-400 font-bold block">
                        * Вы можете ввести эмодзи слева ИЛИ загрузить файл-логотип
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Customizable Chest Image Card */}
            <div className="space-y-3 bg-white p-6 rounded-3xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                📦 Картинка Сундука для 15 и 30 дня
              </h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Загрузите красивую картинку сундука или вставьте URL, который будет показываться на 15-й и 30-й день в календаре отметок.
              </p>

              <div className="flex items-center gap-4 pt-1">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-4xl overflow-hidden shadow-inner shrink-0">
                  {settings.chestImageUrl && (settings.chestImageUrl.startsWith("http") || settings.chestImageUrl.startsWith("data:")) ? (
                    <img 
                      src={settings.chestImageUrl} 
                      alt="Chest" 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    "🎁"
                  )}
                </div>

                <div className="flex-grow space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={chestInputRef}
                      onChange={handleChestUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => chestInputRef.current?.click()}
                      disabled={chestUploading}
                      className={`px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                        chestUploading ? "opacity-50" : ""
                      }`}
                    >
                      <Upload className="w-4 h-4 text-amber-500" />
                      {chestUploading ? "Загрузка..." : "Загрузить фото"}
                    </button>

                    {settings.chestImageUrl && (
                      <button
                        type="button"
                        onClick={async () => {
                          await onUpdateSettings({ chestImageUrl: "" });
                          showAlert("Успешно", "Сброшено на эмодзи сундука по умолчанию! 🎁");
                        }}
                        className="py-2 px-3 text-rose-500 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                      >
                        Сбросить
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Или вставьте ссылку на картинку (https://...)"
                    value={settings.chestImageUrl || ""}
                    onChange={async (e) => {
                      await onUpdateSettings({ chestImageUrl: e.target.value.trim() });
                    }}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Color Palettes */}
            <div className="space-y-3 bg-white p-6 rounded-3xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Палитра оформления</h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                Выберите основной цвет для кнопок, иконок и акцентов интерфейса. Изменение применится мгновенно для всех.
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {Object.entries(TAILWIND_COLOR_PALETTES).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => handleSelectPalette(key)}
                    className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      primaryColor === key 
                        ? "border-slate-800 bg-slate-50 shadow-sm" 
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${value.bg}`}></span>
                    <span className="text-xs font-semibold text-slate-700">{value.name}</span>
                    {primaryColor === key && <Check className="w-3.5 h-3.5 text-slate-800 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER PROFILE MODAL */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-slate-800 text-sm">
                Редактировать профиль
              </h4>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Имя / Никнейм</label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Google Email (для безопасного входа)
                </label>
                <input
                  type="email"
                  value={editUserEmail}
                  onChange={(e) => setEditUserEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  Telegram Chat ID (для личных уведомлений)
                </label>
                <input
                  type="text"
                  value={editUserTelegram}
                  onChange={(e) => setEditUserTelegram(e.target.value)}
                  placeholder="Например: 582910482"
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Выбрать Аватарку</label>
                <div className="grid grid-cols-7 gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                  {PRESET_AVATARS.slice(0, 14).map((av) => (
                    <button
                      key={av.emoji}
                      type="button"
                      onClick={() => setEditUserAvatar(av.emoji)}
                      className={`text-xl p-1 rounded-lg hover:bg-slate-200 transition-all ${
                        editUserAvatar === av.emoji ? "bg-amber-100 scale-110 border border-amber-300" : ""
                      }`}
                    >
                      {av.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 py-2.5 ${palette.bg} ${palette.hover} text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer`}
                >
                  {loading ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* SYSTEM AND RESET TAB */}
      {activeTab === "system" && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white border border-rose-100 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-rose-700 flex items-center gap-1.5">
                <Settings2 className="w-4 h-4" />
                Панель управления системой и сброс данных
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Здесь вы можете полностью сбросить балансы, стереть историю квестов или очистить всю базу данных для начала нового периода. Будьте аккуратны, все операции необратимы!
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {/* Option 1: Reset points & streaks */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-700 text-sm">
                    🔄 Сбросить балансы монет и серии отметок
                  </h4>
                  <p className="text-slate-400 text-[11px] leading-normal max-w-md">
                    Обнулит монеты у всех детей в семье, а также сбросит серии ежедневных отметок в Дневнике (Day Streak = 0).
                  </p>
                </div>
                <button
                  onClick={handleResetAllBalancesAndStreaks}
                  disabled={loading}
                  className="w-full sm:w-auto py-2 px-4 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center"
                >
                  Сбросить серии
                </button>
              </div>

              {/* Option 1.5: Clear old chores */}
              <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-700 text-sm">
                    🧹 Удалить архивные и старые задания
                  </h4>
                  <p className="text-slate-400 text-[11px] leading-normal max-w-md">
                    Удалит из базы все завершенные (выполненные и оплаченные) и отмененные задания, чтобы очистить списки и исправить баги.
                  </p>
                </div>
                <button
                  onClick={handleClearOldChores}
                  disabled={loading}
                  className="w-full sm:w-auto py-2 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center"
                >
                  Очистить архив
                </button>
              </div>

              {/* Option 2: Complete purge */}
              <div className="p-4 border border-rose-100 rounded-2xl bg-rose-50/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="font-extrabold text-rose-700 text-sm">
                    ⚠️ Полная очистка всей базы данных
                  </h4>
                  <p className="text-rose-600/70 text-[11px] leading-normal max-w-md">
                    Удалит абсолютно все созданные задания, товары в магазине, всю историю выполненных заданий и покупок у всех пользователей.
                  </p>
                </div>
                <button
                  onClick={handleClearAllSystemData}
                  disabled={loading}
                  className="w-full sm:w-auto py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center"
                >
                  Очистить всё
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORIES MANAGEMENT TAB */}
      {activeTab === "categories" && (
        <div className="space-y-6 max-w-xl">
          <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-1.5">
                <Tag className={`w-4 h-4 ${palette.text}`} />
                Управление категориями магазина
              </h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                Добавляйте новые или удаляйте старые категории для витрины наград. Дети смогут фильтровать призы по выбранным категориям в витрине.
              </p>
            </div>

            {/* Current Categories List */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Текущие категории ({(settings.categories || DEFAULT_CATEGORIES).length})</label>
              <div className="flex flex-wrap gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                {(settings.categories || DEFAULT_CATEGORIES).map((cat) => (
                  <div
                    key={cat}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-white border border-slate-200 text-slate-700 shadow-2xs`}
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      title="Удалить категорию"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Category Form */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Добавить новую категорию</label>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const val = fd.get("newCat") as string;
                  if (val) {
                    handleAddCategory(val);
                    e.currentTarget.reset();
                  }
                }}
                className="flex gap-2 mt-1.5"
              >
                <input
                  type="text"
                  name="newCat"
                  required
                  placeholder="Например: Книги или Одежда"
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className={`px-4 py-2.5 ${palette.bg} ${palette.hover} text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1 shrink-0`}
                >
                  <Plus className="w-3.5 h-3.5" /> Добавить
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8 space-y-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-500" />
            Рассылка и Сундуки
          </h2>
          <div className="max-w-xl">
            <form onSubmit={handleSendNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Кому отправить</label>
                <select 
                  value={notifTarget} 
                  onChange={e => setNotifTarget(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Всем детям</option>
                  {users.filter(u => u.role === "kid").map(k => (
                    <option key={k.id} value={k.id}>{k.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Тип отправки</label>
                <select 
                  value={notifType} 
                  onChange={e => setNotifType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="message">Обычное сообщение</option>
                  <option value="chest">Сундук с монетами</option>
                </select>
              </div>

              {notifType === "message" && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Сообщение</label>
                  <textarea
                    required
                    value={notifText}
                    onChange={e => setNotifText(e.target.value)}
                    rows={3}
                    placeholder="Молодец, сегодня отлично потрудился!"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              {notifType === "chest" && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Количество сундуков</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={notifChestPoints}
                    onChange={e => setNotifChestPoints(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Ребенок получит указанное количество сундуков (каждый содержит от 1 до 50 случайных монет).</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 ${palette.bg} ${palette.hover} text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer`}
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                Отправить
              </button>
            </form>
          </div>
        </div>
      )}

      {/* FAQ TAB */}
      {activeTab === "faq" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-indigo-500" />
              Вопросы и Ответы (FAQ)
            </h2>
            <button
              onClick={handleAddFaq}
              className={`px-4 py-2 ${palette.bg} text-white text-xs font-bold rounded-xl transition-all hover:opacity-90 flex items-center gap-1.5 cursor-pointer`}
            >
              <Plus className="w-4 h-4" /> Добавить
            </button>
          </div>
          
          <div className="space-y-4">
            {faqs.map(faq => (
              <div key={faq.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 relative">
                <button 
                  onClick={() => handleRemoveFaq(faq.id)}
                  className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Вопрос</label>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={e => handleUpdateFaq(faq.id, "question", e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ответ</label>
                  <textarea
                    value={faq.answer}
                    onChange={e => handleUpdateFaq(faq.id, "answer", e.target.value)}
                    rows={2}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            ))}
            {faqs.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-2xl">
                Нет ни одного вопроса.
              </div>
            )}
          </div>
          
          <button
            onClick={handleSaveFaqs}
            disabled={loading}
            className={`w-full py-3 mt-4 ${palette.bg} ${palette.hover} text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer`}
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            Сохранить FAQ
          </button>
        </div>
      )}

      
      
      {/* PROMO CODES TAB */}
      {activeTab === "promo" && (
        <PromoManager db={db} showAlert={showAlert} showConfirm={showConfirm} />
      )}

      {/* ACHIEVEMENTS TAB */}
      {activeTab === "achievements" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 lg:p-8 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-indigo-500" />
              Достижения
            </h2>
          </div>
          
          <div className="space-y-6">
            {users.filter(u => u.role === "kid").map(kid => (
              <div key={kid.id} className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-3xl">{kid.avatar}</span>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{kid.name}</h3>
                    <p className="text-xs font-semibold text-indigo-500">{kid.points || 0} монет</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {ACHIEVEMENTS.map(ach => {
                    const userAch = (kid.achievements || {})[ach.id];
                    const isCompleted = userAch?.completed || false;
                    return (
                      <div key={ach.id} className={`p-3 rounded-2xl border flex items-center gap-3 ${isCompleted ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                        <div className={`text-2xl ${!isCompleted && 'opacity-30 grayscale'}`}>{ach.icon}</div>
                        <div className="flex-1">
                          <h5 className="font-bold text-xs text-slate-700">{ach.title}</h5>
                          <button 
                            onClick={async () => {
                              try {
                                const updates = { achievements: { [ach.id]: { completed: !isCompleted, progress: !isCompleted ? ach.target : 0 } } };
                                await setDoc(doc(db, "users", kid.id), updates, { merge: true });
                              } catch (e) { console.error(e); }
                            }}
                            className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${isCompleted ? 'bg-indigo-200 text-indigo-800 hover:bg-indigo-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                          >
                            {isCompleted ? "Забрать" : "Выдать"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {users.filter(u => u.role === "kid").length === 0 && (
              <div className="text-center p-8 text-slate-500 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                Сначала добавьте детей в систему.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
