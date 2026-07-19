import React, { useState, useEffect } from "react";
import { FamilyUser, SiteSettings } from "../types";
import { db } from "../firebase";
import { doc, setDoc, updateDoc, deleteDoc, collection } from "firebase/firestore";
import { 
  Users, Bot, Palette, Plus, Trash2, RefreshCw, 
  Check, Save, ArrowRight, UserPlus, Settings2, Info, Compass, Pencil
} from "lucide-react";
import { motion } from "motion/react";
import { 
  generateRandomNickname, getRandomAvatar, PRESET_AVATARS, 
  TAILWIND_COLOR_PALETTES 
} from "../presets";
import { fetchBotInfo, fetchTelegramUpdates, TelegramUpdateChat, sendTelegramNotification } from "../utils/telegram";

interface AdminPanelProps {
  currentUser: any;
  users: FamilyUser[];
  settings: SiteSettings;
  onUpdateSettings: (newSettings: Partial<SiteSettings>) => void;
  primaryColor: keyof typeof TAILWIND_COLOR_PALETTES;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export default function AdminPanel({ currentUser, users, settings, onUpdateSettings, primaryColor, showAlert, showConfirm }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<"users" | "telegram" | "branding">("users");
  const [loading, setLoading] = useState(false);
  
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

  // Telegram helper state
  const [telegramLogs, setTelegramLogs] = useState<TelegramUpdateChat[]>([]);
  const [botUsername, setBotUsername] = useState("");
  const [customChatId, setCustomChatId] = useState(settings.telegramChatId || "");
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

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
        email: emailValue
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
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex gap-1">
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
                <label className="block text-[10px] text-slate-400 font-bold uppercase">Логотип (Emoji)</label>
                <input
                  type="text"
                  value={settings.logo}
                  onChange={(e) => handleUpdateSiteTitle(settings.title, e.target.value)}
                  className="w-20 mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-lg text-center font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
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
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
    </div>
  );
}
