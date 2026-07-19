import React, { useState, useEffect, useRef } from "react";
import { Chore, FamilyUser, MarketItem, Purchase, SiteSettings } from "../types";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, doc, setDoc, deleteDoc } from "firebase/firestore";
import { 
  Sparkles, Plus, Check, Clock, Eye, AlertCircle, Trash2, 
  Tag, ShoppingBag, Award, Camera, CornerDownRight, ThumbsUp, ThumbsDown, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DEFAULT_CHORE_PRESETS, TAILWIND_COLOR_PALETTES } from "../presets";
import { sendTelegramNotification } from "../utils/telegram";
import { uploadImageToImgbb } from "../utils/upload";

interface ParentDashboardProps {
  currentUser: FamilyUser;
  kids: FamilyUser[];
  chores: Chore[];
  marketItems: MarketItem[];
  purchases: Purchase[];
  settings: SiteSettings;
  primaryColor: keyof typeof TAILWIND_COLOR_PALETTES;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export default function ParentDashboard({
  currentUser,
  kids,
  chores,
  marketItems,
  purchases,
  settings,
  primaryColor,
  showAlert,
  showConfirm
}: ParentDashboardProps) {
  const [view, setView] = useState<"chores" | "market" | "purchases">("chores");
  const [loading, setLoading] = useState(false);

  // New chore form state
  const [choreTitle, setChoreTitle] = useState("");
  const [choreDesc, setChoreDesc] = useState("");
  const [chorePoints, setChorePoints] = useState(10);
  const [selectedKids, setSelectedKids] = useState<string[]>([]);
  
  // Custom points input state for partial approval
  const [customApprovalPoints, setCustomApprovalPoints] = useState<Record<string, number>>({});
  const [parentFeedback, setParentFeedback] = useState<Record<string, string>>({});
  const [reviewChore, setReviewChore] = useState<Chore | null>(null);

  // New market item form state
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemCost, setItemCost] = useState(20);
  const [itemImage, setItemImage] = useState("🎁"); // emoji or url
  const [itemStock, setItemStock] = useState<number>(5);

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Изображение слишком большое! Максимальный размер 5МБ.");
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const base64Str = reader.result as string;
        const uploadedUrl = await uploadImageToImgbb(base64Str);
        if (uploadedUrl) {
          setItemImage(uploadedUrl);
          alert("Изображение успешно загружено на сервер! 🎉");
        } else {
          alert("Не удалось загрузить изображение. Пожалуйста, попробуйте еще раз.");
        }
      } catch (err) {
        console.error("Failed to upload image:", err);
        showAlert("Ошибка", "Произошла ошибка при загрузке картинки.");
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const palette = TAILWIND_COLOR_PALETTES[primaryColor] || TAILWIND_COLOR_PALETTES.indigo;

  // Toggle child selection for task assignment
  const handleToggleKid = (kidId: string) => {
    setSelectedKids(prev => 
      prev.includes(kidId) ? prev.filter(id => id !== kidId) : [...prev, kidId]
    );
  };

  // Pre-fill chore form with preset
  const handleApplyPreset = (preset: typeof DEFAULT_CHORE_PRESETS[0]) => {
    setChoreTitle(preset.title);
    setChoreDesc(preset.description);
    setChorePoints(preset.points);
  };

  // Create new chore(s)
  const handleCreateChore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!choreTitle.trim() || selectedKids.length === 0) return;

    setLoading(true);
    try {
      // Create a separate chore record for each selected child
      for (const kidId of selectedKids) {
        const kid = kids.find(k => k.id === kidId);
        if (!kid) continue;

        const choreId = "chore-" + Math.random().toString(36).substr(2, 9);
        const timeoutMinutes = 30; // standard task timeout
        const now = new Date();
        const timeoutAt = new Date(now.getTime() + timeoutMinutes * 60 * 1000);

        const newChore: Chore = {
          id: choreId,
          title: choreTitle.trim(),
          description: choreDesc.trim(),
          points: Number(chorePoints),
          assignedTo: [kidId],
          status: "pending",
          createdAt: now,
          createdBy: currentUser.id,
          timeoutAt: timeoutAt
        };

        await setDoc(doc(db, "chores", choreId), newChore);

        // Send Telegram notification
        if (settings.telegramChatId) {
          await sendTelegramNotification(
            `⚡ <b>Новое задание!</b>\nКому: ${kid.name} ${kid.avatar}\nЗадание: <b>${newChore.title}</b>\nОписание: ${newChore.description}\nНаграда: 🪙 <b>${newChore.points} баллов</b>\n\n<i>Время на принятие: 30 минут!</i>`,
            settings.telegramChatId
          );
        }
      }

      // Reset form
      setChoreTitle("");
      setChoreDesc("");
      setChorePoints(10);
      setSelectedKids([]);
      showAlert("Успешно", "Задание успешно создано и отправлено!");
    } catch (err) {
      console.error("Failed to create chore:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete chore
  const handleDeleteChore = (id: string, title: string) => {
    showConfirm(
      "Удаление задания",
      `Вы уверены, что хотите удалить задание "${title}"?`,
      async () => {
        try {
          await deleteDoc(doc(db, "chores", id));
        } catch (err) {
          console.error("Failed to delete chore:", err);
          showAlert("Ошибка", "Не удалось удалить задание: " + err);
        }
      }
    );
  };

  // Approve chore with full or custom points
  const handleApproveChore = async (chore: Chore, isFull: boolean) => {
    const pointsToAward = isFull ? chore.points : (customApprovalPoints[chore.id] ?? chore.points);
    const feedback = parentFeedback[chore.id] || "Отличная работа! Умница! 🎉";
    const kidId = chore.assignedTo[0];
    const kid = kids.find(k => k.id === kidId);
    if (!kid) return;

    try {
      setLoading(true);
      
      // 1. Update Chore status
      await updateDoc(doc(db, "chores", chore.id), {
        status: "approved",
        finalPoints: pointsToAward,
        parentFeedback: feedback,
        completedAt: new Date()
      });

      // 2. Add points to Kid
      const newBalance = kid.points + pointsToAward;
      await updateDoc(doc(db, "users", kidId), {
        points: newBalance
      });

      // Send Telegram notification
      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `✅ <b>Задание одобрено!</b>\nРебенок: ${kid.name} ${kid.avatar}\nКвест: <b>${chore.title}</b>\nНачислено: 🪙 <b>${pointsToAward} баллов</b> (из ${chore.points})\nОтзыв: "${feedback}"`,
          settings.telegramChatId
        );
      }

      setReviewChore(null);
      showAlert("Успешно", "Задание одобрено, баллы начислены!");
    } catch (err) {
      console.error("Failed to approve chore:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reject chore
  const handleRejectChore = async (chore: Chore) => {
    const feedback = parentFeedback[chore.id] || "Задание выполнено не до конца или неаккуратно. Переделай, пожалуйста. 🧹";
    const kidId = chore.assignedTo[0];
    const kid = kids.find(k => k.id === kidId);
    if (!kid) return;

    try {
      setLoading(true);
      await updateDoc(doc(db, "chores", chore.id), {
        status: "rejected",
        parentFeedback: feedback
      });

      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `❌ <b>Задание отклонено!</b>\nРебенок: ${kid.name} ${kid.avatar}\nКвест: <b>${chore.title}</b>\nПричина: "${feedback}"\n\n<i>Задание возвращено на доработку.</i>`,
          settings.telegramChatId
        );
      }

      setReviewChore(null);
      showAlert("Выполнено", "Задание возвращено ребенку на доработку.");
    } catch (err) {
      console.error("Failed to reject chore:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add marketplace product
  const handleCreateMarketItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim() || !itemCost) return;

    setLoading(true);
    try {
      const itemId = "item-" + Math.random().toString(36).substr(2, 9);
      const newItem: MarketItem = {
        id: itemId,
        title: itemName.trim(),
        description: itemDesc.trim(),
        points: Number(itemCost),
        stock: Number(itemStock),
        image: itemImage,
        createdBy: currentUser.id,
        createdAt: new Date()
      };

      await setDoc(doc(db, "marketplace", itemId), newItem);
      
      setItemName("");
      setItemDesc("");
      setItemCost(20);
      setItemStock(5);
      setItemImage("🎁");
      showAlert("Успешно", "Товар успешно добавлен в магазин!");
    } catch (err) {
      console.error("Failed to create market item:", err);
    } finally {
      setLoading(false);
    }
  };

  // Delete market item
  const handleDeleteMarketItem = (id: string, title: string) => {
    showConfirm(
      "Удаление товара",
      `Вы уверены, что хотите удалить товар "${title}" из магазина?`,
      async () => {
        try {
          await deleteDoc(doc(db, "marketplace", id));
        } catch (err) {
          console.error("Failed to delete market item:", err);
          showAlert("Ошибка", "Не удалось удалить товар: " + err);
        }
      }
    );
  };

  // Deliver purchased item to child
  const handleDeliverPurchase = async (purchase: Purchase) => {
    try {
      setLoading(true);
      await updateDoc(doc(db, "purchases", purchase.id), {
        status: "issued",
        issuedAt: new Date()
      });

      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `🎁 <b>Награда выдана ребенку!</b>\nКому: ${purchase.kidName}\nПриз: <b>${purchase.productTitle}</b>\nСтатус: <b>Вручено лично в руки!</b>`,
          settings.telegramChatId
        );
      }
      showAlert("Выдано", "Статус изменен на 'Выдан'. Ребенок будет счастлив!");
    } catch (err) {
      console.error("Failed to update purchase status:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Submenu */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setView("chores")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            view === "chores"
              ? `${palette.bg} text-white shadow`
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4" />
          Задания и Квесты
        </button>
        <button
          onClick={() => setView("market")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            view === "market"
              ? `${palette.bg} text-white shadow`
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Витрина Магазина
        </button>
        <button
          onClick={() => setView("purchases")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative cursor-pointer ${
            view === "purchases"
              ? `${palette.bg} text-white shadow`
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Clock className="w-4 h-4" />
          Покупки детей
          {purchases.filter(p => p.status === "pending").length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-extrabold text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce border-2 border-white">
              {purchases.filter(p => p.status === "pending").length}
            </span>
          )}
        </button>
      </div>

      {/* CHORES VIEW */}
      {view === "chores" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* New Chore creator */}
          <div className="xl:col-span-1 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4.5 h-4.5 text-amber-500" />
              Раздать новое задание
            </h3>

            {/* Quick Presets */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase">Шаблоны быстрых дел</label>
              <div className="flex flex-wrap gap-1.5">
                {DEFAULT_CHORE_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="py-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-semibold transition-all cursor-pointer"
                  >
                    {preset.title.split(" ")[0]}..
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleCreateChore} className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Название квеста</label>
                <input
                  type="text"
                  required
                  placeholder="Вытереть пыль в зале"
                  value={choreTitle}
                  onChange={(e) => setChoreTitle(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Инструкция (описание)</label>
                <textarea
                  rows={2}
                  placeholder="Протереть все поверхности, используя тряпку из микрофибры..."
                  value={choreDesc}
                  onChange={(e) => setChoreDesc(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Цена (баллы 🪙)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={chorePoints}
                    onChange={(e) => setChorePoints(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Лимит принятия</label>
                  <div className="w-full mt-1 p-2.5 bg-slate-100 text-slate-500 rounded-xl text-xs font-bold select-none border border-slate-200">
                    ⏱️ 30 минут
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Кому поручить задание?</label>
                {kids.length === 0 ? (
                  <p className="text-[10px] text-rose-500 font-bold mt-1">Добавьте детей в панели настроек!</p>
                ) : (
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {kids.map(k => (
                      <button
                        key={k.id}
                        type="button"
                        onClick={() => handleToggleKid(k.id)}
                        className={`py-1.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          selectedKids.includes(k.id)
                            ? `${palette.border} bg-amber-50/40 ${palette.text}`
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-base">{k.avatar}</span>
                        <span>{k.name}</span>
                        {selectedKids.includes(k.id) && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || selectedKids.length === 0}
                className={`w-full py-3 mt-2 ${palette.bg} ${palette.hover} text-white text-xs font-bold rounded-2xl shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
              >
                Отправить задание детям 🚀
              </button>
            </form>
          </div>

          {/* Active / Submitted Chores panel */}
          <div className="xl:col-span-2 space-y-6">
            {/* Awaiting Review */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">На проверке ({chores.filter(c => c.status === "completed").length})</h4>
              {chores.filter(c => c.status === "completed").length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-medium">
                  Нет выполненных заданий, ожидающих вашей проверки.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {chores.filter(c => c.status === "completed").map((chore) => {
                    const kid = kids.find(k => k.id === chore.assignedTo[0]);
                    return (
                      <motion.div
                        layoutId={`chore-card-${chore.id}`}
                        key={chore.id}
                        className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative overflow-hidden"
                      >
                        <div className="absolute top-3 right-3 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <Camera className="w-3 h-3" /> С фотоотчетом
                        </div>

                        <div>
                          <span className="text-2xl">{kid?.avatar || "👦"}</span>
                          <span className="text-xs font-extrabold text-slate-400 ml-1.5 uppercase">
                            Выполнил: {kid?.name}
                          </span>
                        </div>

                        <div>
                          <h5 className="font-bold text-slate-800 text-sm leading-tight">{chore.title}</h5>
                          <p className="text-slate-500 text-xs mt-1 truncate">{chore.description}</p>
                        </div>

                        {chore.proofPhoto && (
                          <div 
                            onClick={() => setReviewChore(chore)}
                            className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-100 relative group cursor-zoom-in"
                          >
                            <img 
                              src={chore.proofPhoto} 
                              alt="Proof" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all">
                              🔎 Нажмите для оценки
                            </div>
                          </div>
                        )}

                        <div className="text-xs flex gap-2 justify-end pt-1">
                          <button
                            onClick={() => setReviewChore(chore)}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                          >
                            🔎 Оценить работу
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Active & Pending chores */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Активные задания в процессе ({chores.filter(c => c.status === "accepted" || c.status === "pending" || c.status === "rejected").length})</h4>
              {chores.filter(c => c.status === "accepted" || c.status === "pending" || c.status === "rejected").length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-medium">
                  Нет активных заданий. Поручите новое!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {chores.filter(c => c.status === "accepted" || c.status === "pending" || c.status === "rejected").map((chore) => {
                    const kid = kids.find(k => k.id === chore.assignedTo[0]);
                    return (
                      <div 
                        key={chore.id}
                        className="p-4 border border-slate-200 bg-white rounded-2xl flex flex-col justify-between gap-3 shadow-sm relative group"
                      >
                        <button
                          onClick={() => handleDeleteChore(chore.id, chore.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl">{kid?.avatar || "👦"}</span>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase">{kid?.name}</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ml-auto ${
                              chore.status === "pending" ? "bg-amber-100 text-amber-700" :
                              chore.status === "rejected" ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {chore.status === "pending" ? "Ожидает" :
                               chore.status === "rejected" ? "Доработка" : "Выполняется"}
                            </span>
                          </div>

                          <h5 className="font-bold text-slate-800 text-xs pt-1">{chore.title}</h5>
                          <p className="text-slate-400 text-[10px] line-clamp-2 leading-relaxed">{chore.description}</p>
                        </div>

                        <div className="border-t border-slate-50 pt-2 flex items-center justify-between text-[10px] text-slate-400 font-bold">
                          <div>
                            Награда: <span className="text-amber-600">🪙 {chore.points} баллов</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {chore.status === "pending" ? "До 30 мин" : "До 60 мин"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Approved / History Log */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">История выполненных ({chores.filter(c => c.status === "approved").length})</h4>
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                {chores.filter(c => c.status === "approved").length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">История пока пуста.</div>
                ) : (
                  chores.filter(c => c.status === "approved").slice(0, 10).map((chore) => {
                    const kid = kids.find(k => k.id === chore.assignedTo[0]);
                    return (
                      <div key={chore.id} className="p-3 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-lg">{kid?.avatar || "👦"}</span>
                          <div className="truncate">
                            <span className="font-semibold text-slate-700 truncate">{chore.title}</span>
                            <div className="text-[10px] text-slate-400">Исполнитель: {kid?.name}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="font-bold text-emerald-600">+{chore.finalPoints || chore.points} 🪙</span>
                          <div className="text-[9px] text-slate-400">Одобрено</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VITRINA MANAGER VIEW */}
      {view === "market" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Create Reward item form */}
          <div className="xl:col-span-1 p-5 bg-white border border-slate-100 rounded-3xl shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <ShoppingBag className="w-4.5 h-4.5 text-pink-500" />
              Добавить товар / Награду
            </h3>

            <form onSubmit={handleCreateMarketItem} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Название приза</label>
                <input
                  type="text"
                  required
                  placeholder="30 минут за ПК 🖥️"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Описание / Условия</label>
                <textarea
                  rows={2}
                  placeholder="Доступ к играм на компьютере в течение получаса сегодня вечером."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Стоимость (монеты 🪙)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={itemCost}
                    onChange={(e) => setItemCost(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Количество (штук)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={itemStock}
                    onChange={(e) => setItemStock(Number(e.target.value))}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    title="0 для бесконечного количества"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Иконка / Изображение</label>
                <div className="grid grid-cols-6 gap-1 bg-white p-2 rounded-xl border border-slate-200 mt-1">
                  {["🎁", "🖥️", "🍕", "🎮", "🍭", "🧸", "📚", "🎬", "🥤", "🛹", "⚽", "🚗"].map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setItemImage(em)}
                      className={`text-xl p-1 rounded-lg hover:bg-slate-100 transition-all cursor-pointer ${
                        itemImage === em ? "bg-pink-100 scale-110 border border-pink-300" : ""
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>

                {/* File upload selector to upload to IMGBB */}
                <div className="mt-2.5 space-y-2 bg-white border border-slate-200 p-3 rounded-xl flex flex-col items-center justify-center">
                  {uploadingImage ? (
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <RefreshCw className="w-5 h-5 text-indigo-500 animate-spin" />
                      <span className="text-[10px] font-black text-slate-500">Загрузка картинки на ImgBB...</span>
                    </div>
                  ) : itemImage.startsWith("http") ? (
                    <div className="w-full flex items-center gap-2">
                      <img src={itemImage} alt="Award custom" className="w-8 h-8 rounded-lg object-cover border border-slate-200" referrerPolicy="no-referrer" />
                      <div className="text-[9px] font-bold text-emerald-600 truncate flex-grow">Своё изображение загружено!</div>
                      <button 
                        type="button" 
                        onClick={() => setItemImage("🎁")}
                        className="text-[9px] font-black text-rose-500 hover:underline cursor-pointer"
                      >
                        Сбросить
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 bg-slate-50 border border-dashed border-slate-300 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      📁 Загрузить свою картинку (с устройства)
                    </button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileSelectImage}
                    className="hidden"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Или вставьте прямую ссылку на картинку"
                  value={itemImage.startsWith("http") ? itemImage : ""}
                  onChange={(e) => setItemImage(e.target.value || "🎁")}
                  className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 mt-2 ${palette.bg} ${palette.hover} text-white text-xs font-bold rounded-2xl shadow-sm transition-all cursor-pointer`}
              >
                Опубликовать на витрине 🎉
              </button>
            </form>
          </div>

          {/* Current products list */}
          <div className="xl:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Товары на витрине ({marketItems.length})</h4>
            {marketItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-medium">
                Магазин пуст. Добавьте первый товар!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {marketItems.map((item) => (
                  <div 
                    key={item.id}
                    className="p-4 border border-slate-200 bg-white rounded-2xl flex justify-between gap-3 shadow-sm relative group"
                  >
                    <button
                      onClick={() => handleDeleteMarketItem(item.id, item.title)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex gap-3">
                      <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                        {item.image.startsWith("http") ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          item.image
                        )}
                      </div>

                      <div className="space-y-0.5 truncate">
                        <h5 className="font-bold text-slate-800 text-sm truncate pr-4">{item.title}</h5>
                        <p className="text-slate-400 text-[10px] line-clamp-2 leading-relaxed">{item.description}</p>
                        <div className="pt-1 flex items-center gap-2">
                          <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                            🪙 {item.points} монет
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            Остаток: {item.stock === 0 ? "♾️ безлимит" : `${item.stock} шт`}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PURCHASES LIST VIEW */}
      {view === "purchases" && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Купленные призы и доступы ({purchases.length})</h4>
          
          {purchases.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-medium">
              Пока никто ничего не покупал.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {purchases.map((pur) => {
                const kid = kids.find(k => k.id === pur.kidId);
                return (
                  <div 
                    key={pur.id}
                    className={`p-4 border rounded-2xl bg-white shadow-sm flex flex-col justify-between gap-3 relative overflow-hidden ${
                      pur.status === "pending" ? "border-rose-200 bg-rose-50/10" : "border-slate-200"
                    }`}
                  >
                    <div className="absolute top-2.5 right-2.5">
                      <span className={`text-[9px] font-extrabold py-0.5 px-2 rounded-full uppercase ${
                        pur.status === "pending" ? "bg-rose-100 text-rose-700 animate-pulse" : "bg-slate-100 text-slate-600"
                      }`}>
                        {pur.status === "pending" ? "⏳ Ожидает" : " выдано"}
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <div className="text-3xl bg-slate-100 p-2 rounded-xl h-12 w-12 flex items-center justify-center border border-slate-100 shrink-0">
                        {pur.productImage && pur.productImage.startsWith("http") ? (
                          <img src={pur.productImage} alt={pur.productTitle} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          pur.productImage || "🎁"
                        )}
                      </div>

                      <div className="truncate">
                        <div className="text-[10px] font-extrabold text-indigo-500 uppercase flex items-center gap-1.5">
                          <span>{kid?.avatar || "👦"}</span>
                          <span>Купил: {pur.kidName}</span>
                        </div>
                        <h5 className="font-bold text-slate-800 text-sm mt-0.5 truncate pr-8">{pur.productTitle}</h5>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Списано: <span className="font-bold text-amber-600">🪙 {pur.points} баллов</span>
                        </div>
                      </div>
                    </div>

                    {pur.status === "pending" && (
                      <button
                        onClick={() => handleDeliverPurchase(pur)}
                        disabled={loading}
                        className={`w-full py-2 ${palette.bg} ${palette.hover} text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer`}
                      >
                        <Check className="w-4 h-4" /> Выдать товар лично!
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* FULL SCREEN REVIEW CHORE DIALOG (MODAL) */}
      <AnimatePresence>
        {reviewChore && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Проверка выполнения</h4>
                  <p className="text-[10px] text-slate-400">Проверьте фото и начислите баллы</p>
                </div>
                <button 
                  onClick={() => setReviewChore(null)} 
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold"
                >
                  Закрыть
                </button>
              </div>

              {/* Body */}
              <div className="p-5 overflow-y-auto space-y-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{reviewChore.title}</h3>
                  <p className="text-slate-500 text-xs">{reviewChore.description}</p>
                </div>

                {reviewChore.proofPhoto && (
                  <div className="w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
                    <img 
                      src={reviewChore.proofPhoto} 
                      alt="Proof submission" 
                      className="w-full object-contain max-h-[300px]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
                  <h5 className="font-bold text-slate-700 text-xs flex items-center gap-1">
                    <CornerDownRight className="w-4 h-4 text-indigo-500" />
                    Оценка работы и Обратная связь
                  </h5>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Оценка стараний (Награда 🪙)</label>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="range"
                        min={1}
                        max={reviewChore.points}
                        value={customApprovalPoints[reviewChore.id] ?? reviewChore.points}
                        onChange={(e) => setCustomApprovalPoints({
                          ...customApprovalPoints,
                          [reviewChore.id]: Number(e.target.value)
                        })}
                        className="flex-1 accent-amber-500"
                      />
                      <span className="font-mono font-black text-amber-600 text-base bg-amber-100 px-3 py-1 rounded-xl">
                        {customApprovalPoints[reviewChore.id] ?? reviewChore.points} / {reviewChore.points}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Вы можете дать меньше за плохую работу, или минимум 1 балл за старания!</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">Комментарий или похвала</label>
                    <input
                      type="text"
                      placeholder="Отличная работа! Молодчинка! 🎉"
                      value={parentFeedback[reviewChore.id] || ""}
                      onChange={(e) => setParentFeedback({
                        ...parentFeedback,
                        [reviewChore.id]: e.target.value
                      })}
                      className="w-full mt-1 p-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="p-4 border-t border-slate-100 flex gap-2 bg-slate-50">
                <button
                  onClick={() => handleRejectChore(reviewChore)}
                  disabled={loading}
                  className="flex-1 py-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 hover:border-rose-300 font-bold rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ThumbsDown className="w-4 h-4" /> На доработку
                </button>
                
                <button
                  onClick={() => handleApproveChore(reviewChore, false)}
                  disabled={loading}
                  className={`flex-1 py-3 ${palette.bg} ${palette.hover} text-white font-bold rounded-2xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer`}
                >
                  <ThumbsUp className="w-4 h-4" /> Принять работу ✅
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
