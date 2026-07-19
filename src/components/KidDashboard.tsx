import React, { useState, useEffect, useRef } from "react";
import { Chore, FamilyUser, MarketItem, Purchase, SiteSettings } from "../types";
import { db } from "../firebase";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { 
  Sparkles, Award, Clock, Camera, Check, ShoppingBag, 
  Trash2, Flame, Gift, Compass, ShieldAlert, CheckCircle, 
  X, AlertCircle, RefreshCw, Upload, Image as ImageIcon, User, Search
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TAILWIND_COLOR_PALETTES } from "../presets";
import { uploadImageToImgbb } from "../utils/upload";
import { sendTelegramNotification } from "../utils/telegram";

interface KidDashboardProps {
  currentUser: FamilyUser;
  chores: Chore[];
  marketItems: MarketItem[];
  purchases: Purchase[];
  settings: SiteSettings;
  primaryColor: keyof typeof TAILWIND_COLOR_PALETTES;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export default function KidDashboard({
  currentUser,
  chores,
  marketItems,
  purchases,
  settings,
  primaryColor,
  showAlert,
  showConfirm
}: KidDashboardProps) {
  const [activeTab, setActiveTab] = useState<"quests" | "store" | "daily" | "profile">("quests");
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [editingAvatar, setEditingAvatar] = useState(false);

  // Countdowns update every second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Chore proof submission state
  const [submittingChore, setSubmittingChore] = useState<Chore | null>(null);
  const [proofPhotoBase64, setProofPhotoBase64] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Shop confirmation modal state
  const [confirmPurchaseItem, setConfirmPurchaseItem] = useState<MarketItem | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const palette = TAILWIND_COLOR_PALETTES[primaryColor] || TAILWIND_COLOR_PALETTES.indigo;

  // Filtrations
  const kidChores = chores.filter(c => c.assignedTo.includes(currentUser.id));
  const activeKidPurchases = purchases.filter(p => p.kidId === currentUser.id);

  // 1. Daily Check-in Claim logic
  const todayStr = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const canClaimDaily = currentUser.lastCheckIn !== todayStr;
  const nextClaimDayNum = canClaimDaily ? (currentUser.dailyStreak + 1) : currentUser.dailyStreak;
  // If streak exceeds 30, mod it or keep it growing
  const pointsToEarnToday = nextClaimDayNum;

  const handleDailyCheckIn = async () => {
    if (!canClaimDaily || loading) return;

    setLoading(true);
    try {
      const kidRef = doc(db, "users", currentUser.id);
      const newStreak = currentUser.dailyStreak + 1;
      const newBalance = currentUser.points + pointsToEarnToday;

      await updateDoc(kidRef, {
        points: newBalance,
        dailyStreak: newStreak,
        lastCheckIn: todayStr
      });

      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `🔥 <b>Ежедневная отметка!</b>\nРебенок: ${currentUser.name} ${currentUser.avatar}\nСерия: <b>${newStreak} дней подряд!</b>\nПолучено сегодня: 🪙 <b>+${pointsToEarnToday} баллов</b>`,
          settings.telegramChatId
        );
      }

      showAlert("Поздравляем! 🎉", `Вы забрали ежедневную награду: +${pointsToEarnToday} монет! Ваша серия: ${newStreak} дн.!`);
    } catch (err) {
      console.error("Daily checkin failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Chore Status interactions
  const handleAcceptChore = async (choreId: string, title: string) => {
    try {
      const choreRef = doc(db, "chores", choreId);
      const deadlineAt = new Date(Date.now() + 60 * 60 * 1000); // +60 mins from now to finish

      await updateDoc(choreRef, {
        status: "accepted",
        acceptedAt: new Date(),
        deadlineAt: deadlineAt
      });

      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `🏃 <b>Квест принят в работу!</b>\nИсполнитель: ${currentUser.name} ${currentUser.avatar}\nКвест: <b>${title}</b>\n\n<i>Время на выполнение: 60 минут!</i>`,
          settings.telegramChatId
        );
      }
    } catch (err) {
      console.error("Accept chore failed:", err);
    }
  };

  const handleDeclineChore = (choreId: string, title: string) => {
    showConfirm(
      "Отказ от квеста",
      "Вы действительно хотите отказаться от этого квеста?",
      async () => {
        try {
          const choreRef = doc(db, "chores", choreId);
          await updateDoc(choreRef, {
            status: "declined"
          });

          if (settings.telegramChatId) {
            await sendTelegramNotification(
              `⚠️ <b>Ребенок отказался от квеста!</b>\nИсполнитель: ${currentUser.name} ${currentUser.avatar}\nКвест: <b>${title}</b>`,
              settings.telegramChatId
            );
          }
        } catch (err) {
          console.error("Decline chore failed:", err);
        }
      }
    );
  };

  // Camera proof capture helpers
  const handleStartCamera = async () => {
    setCameraActive(true);
    setProofPhotoBase64(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Failed to access camera, fallback to file selection:", err);
      setCameraActive(false);
      showAlert("Внимание", "Не удалось запустить камеру. Пожалуйста, загрузите готовое фото через кнопку выбора файла.");
    }
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setProofPhotoBase64(dataUrl);
        handleStopCamera();
      }
    }
  };

  const handleStopCamera = () => {
    setCameraActive(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPhotoBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Chore proof and upload to IMGBB
  const handleSubmitProof = async () => {
    if (!submittingChore || !proofPhotoBase64 || uploadProgress) return;

    setUploadProgress(true);
    try {
      // 1. Upload Base64 image to IMGBB securely via server proxy
      const uploadedUrl = await uploadImageToImgbb(proofPhotoBase64);
      if (!uploadedUrl) {
        showAlert("Ошибка", "Ошибка при загрузке фото. Пожалуйста, попробуйте еще раз.");
        setUploadProgress(false);
        return;
      }

      // 2. Save proof photo and update status in database
      const choreRef = doc(db, "chores", submittingChore.id);
      await updateDoc(choreRef, {
        status: "completed",
        proofPhoto: uploadedUrl,
        completedAt: new Date()
      });

      // 3. Send Telegram notify to Parent
      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `📸 <b>Отчет по заданию отправлен!</b>\nИсполнитель: ${currentUser.name} ${currentUser.avatar}\nКвест: <b>${submittingChore.title}</b>\n\n<i>Родители, пожалуйста, проверьте отчет и оцените старания!</i>`,
          settings.telegramChatId
        );
      }

      showAlert("Ура! 🎉", "Отчет успешно отправлен родителям на проверку! Ожидайте баллов! 🪙");
      setSubmittingChore(null);
      setProofPhotoBase64(null);
    } catch (err) {
      console.error("Proof submission failed:", err);
      showAlert("Ошибка", "Не удалось отправить отчет. Пожалуйста, попробуйте снова.");
    } finally {
      setUploadProgress(false);
    }
  };

  // 3. Purchase logic
  const handleBuyItem = async () => {
    if (!confirmPurchaseItem || loading) return;
    const item = confirmPurchaseItem;

    if (currentUser.points < item.points) {
      showAlert("Ой!", "Недостаточно баллов для покупки! Выполняйте больше квестов. 🧹");
      setConfirmPurchaseItem(null);
      return;
    }

    setLoading(true);
    try {
      const purchaseId = "purchase-" + Math.random().toString(36).substr(2, 9);
      const kidRef = doc(db, "users", currentUser.id);
      const itemRef = doc(db, "marketplace", item.id);

      // 1. Deduct points from child balance
      const newPoints = currentUser.points - item.points;
      await updateDoc(kidRef, { points: newPoints });

      // 2. Decrement store inventory if stock positive
      if (item.stock > 0) {
        await updateDoc(itemRef, { stock: Math.max(0, item.stock - 1) });
      }

      // 3. Save purchase log record in DB
      const newPurchase: Purchase = {
        id: purchaseId,
        productId: item.id,
        productTitle: item.title,
        productImage: item.image,
        points: item.points,
        kidId: currentUser.id,
        kidName: currentUser.name,
        status: "pending",
        createdAt: new Date()
      };

      await setDoc(doc(db, "purchases", purchaseId), newPurchase);

      // 4. Send Telegram notification to parent
      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `🎉 <b>Новая покупка в Маркете!</b>\nПокупатель: ${currentUser.name} ${currentUser.avatar}\nПриз: <b>${item.title}</b>\nСписано: 🪙 <b>${item.points} монет</b>\n\n<i>Родители, пожалуйста, подтвердите выдачу в админ-панели!</i>`,
          settings.telegramChatId
        );
      }

      showAlert("Поздравляем! 🎉", `Успешно куплено! 🎉 С вашего счета списано ${item.points} монет. Обратитесь к родителям, чтобы забрать приз!`);
      setConfirmPurchaseItem(null);
    } catch (err) {
      console.error("Failed to purchase item:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper countdown renderer
  const renderTimeoutCountdown = (chore: Chore) => {
    if (chore.status === "pending" && chore.timeoutAt) {
      const limit = chore.timeoutAt.toDate ? chore.timeoutAt.toDate() : new Date(chore.timeoutAt);
      const diffMs = limit.getTime() - now.getTime();
      if (diffMs <= 0) {
        return <span className="text-rose-500 font-bold">Срок истек</span>;
      }
      const mins = Math.floor(diffMs / (60 * 1000));
      const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
      return <span className="text-amber-600 font-bold">⏱️ Принять: {mins}м {secs}с</span>;
    }
    
    if (chore.status === "accepted" && chore.deadlineAt) {
      const limit = chore.deadlineAt.toDate ? chore.deadlineAt.toDate() : new Date(chore.deadlineAt);
      const diffMs = limit.getTime() - now.getTime();
      if (diffMs <= 0) {
        return <span className="text-rose-500 font-bold">⏱️ Время вышло!</span>;
      }
      const mins = Math.floor(diffMs / (60 * 1000));
      const secs = Math.floor((diffMs % (60 * 1000)) / 1000);
      return <span className="text-indigo-600 font-bold">⏱️ Сдать: {mins}м {secs}с</span>;
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Points Counter */}
        <div className="bg-amber-100/60 border border-amber-200 rounded-3xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 text-7xl select-none opacity-10 group-hover:scale-110 transition-transform">🪙</div>
          <div>
            <div className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider">Мой Баланс</div>
            <div className="text-2xl font-black text-amber-700 mt-1">🪙 {currentUser.points}</div>
          </div>
        </div>

        {/* Daily Streak */}
        <div className="bg-orange-100/60 border border-orange-200 rounded-3xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 text-7xl select-none opacity-10 group-hover:scale-110 transition-transform">🔥</div>
          <div>
            <div className="text-[10px] font-extrabold text-orange-800 uppercase tracking-wider">Серия входов</div>
            <div className="text-2xl font-black text-orange-700 mt-1">🔥 {currentUser.dailyStreak} дн</div>
          </div>
        </div>

        {/* Quests in Progress */}
        <div className="bg-indigo-100/60 border border-indigo-200 rounded-3xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 text-7xl select-none opacity-10 group-hover:scale-110 transition-transform">🧹</div>
          <div>
            <div className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider">Дела в работе</div>
            <div className="text-2xl font-black text-indigo-700 mt-1">
              {kidChores.filter(c => c.status === "accepted").length}
            </div>
          </div>
        </div>

        {/* Completed count */}
        <div className="bg-emerald-100/60 border border-emerald-200 rounded-3xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 text-7xl select-none opacity-10 group-hover:scale-110 transition-transform">🏆</div>
          <div>
            <div className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Всего сделано</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {kidChores.filter(c => c.status === "approved").length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("quests")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "quests"
              ? `${palette.bg} text-white shadow`
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Award className="w-4 h-4" />
          Мои Задания
          {kidChores.filter(c => c.status === "pending" || c.status === "rejected").length > 0 && (
            <span className="bg-rose-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full">
              {kidChores.filter(c => c.status === "pending" || c.status === "rejected").length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("store")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "store"
              ? `${palette.bg} text-white shadow`
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Магазин Наград
        </button>
        <button
          onClick={() => setActiveTab("daily")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative cursor-pointer ${
            activeTab === "daily"
              ? `${palette.bg} text-white shadow`
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Flame className="w-4 h-4 animate-bounce" />
          Ежедневная Отметка
          {canClaimDaily && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center animate-ping"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "profile"
              ? `${palette.bg} text-white shadow`
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <User className="w-4 h-4" />
          Мой Профиль
        </button>
      </div>

      {/* QUESTS BOARD VIEW */}
      {activeTab === "quests" && (
        <div className="space-y-6">
          {/* New Quests Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin-slow" />
              Новые квесты от родителей ({kidChores.filter(c => c.status === "pending").length})
            </h3>

            {kidChores.filter(c => c.status === "pending").length === 0 ? (
              <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-xs text-slate-400 font-medium shadow-xs">
                Пока нет новых заданий. Мама скоро создаст что-то интересное! 😊
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kidChores.filter(c => c.status === "pending").map((chore) => (
                  <motion.div
                    key={chore.id}
                    layoutId={`chore-card-${chore.id}`}
                    className="p-5 border border-slate-200 bg-white rounded-3xl shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                          🪙 +{chore.points} баллов
                        </span>
                        <div className="text-[10px] font-bold">
                          {renderTimeoutCountdown(chore)}
                        </div>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm leading-tight pt-1">{chore.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">{chore.description}</p>
                    </div>

                    <div className="flex gap-2 border-t border-slate-50 pt-3">
                      <button
                        onClick={() => handleDeclineChore(chore.id, chore.title)}
                        className="flex-1 py-2.5 bg-slate-50 hover:bg-rose-50 border border-slate-100 hover:border-rose-200 text-slate-500 hover:text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      >
                        Отказаться 😞
                      </button>
                      <button
                        onClick={() => handleAcceptChore(chore.id, chore.title)}
                        className={`flex-1 py-2.5 ${palette.bg} ${palette.hover} text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer`}
                      >
                        Принять Квест! 🏃
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Active Work Section */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-500" />
              Задания в работе ({kidChores.filter(c => c.status === "accepted" || c.status === "rejected").length})
            </h3>

            {kidChores.filter(c => c.status === "accepted" || c.status === "rejected").length === 0 ? (
              <div className="p-8 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-xs text-slate-400 font-medium shadow-xs">
                У вас нет активных заданий. Примите новые квесты выше! 🧹
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kidChores.filter(c => c.status === "accepted" || c.status === "rejected").map((chore) => (
                  <div
                    key={chore.id}
                    className={`p-5 border rounded-3xl bg-white shadow-sm flex flex-col justify-between gap-4 relative overflow-hidden ${
                      chore.status === "rejected" ? "border-red-200 bg-rose-50/10" : "border-slate-200"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-xs font-extrabold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-100">
                          🪙 +{chore.points} монет
                        </span>
                        <div className="text-[10px] font-bold">
                          {chore.status === "rejected" ? (
                            <span className="text-red-500 font-extrabold uppercase">❌ Доработка</span>
                          ) : (
                            renderTimeoutCountdown(chore)
                          )}
                        </div>
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm leading-tight pt-1">{chore.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">{chore.description}</p>

                      {chore.parentFeedback && (
                        <div className="p-3 bg-rose-100/50 border border-rose-200 rounded-2xl text-[11px] text-rose-700 leading-normal">
                          <span className="font-bold">Мама пишет:</span> "{chore.parentFeedback}"
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setSubmittingChore(chore)}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Camera className="w-4 h-4" /> Сдать отчет (фотоотчет) 📸
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Under Review & Completed Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Under Review */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Отправлено на проверку ({kidChores.filter(c => c.status === "completed").length})</h4>
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs">
                {kidChores.filter(c => c.status === "completed").length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">Нет заданий на проверке.</div>
                ) : (
                  kidChores.filter(c => c.status === "completed").map((chore) => (
                    <div key={chore.id} className="p-4 flex justify-between items-center gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-800">{chore.title}</div>
                        <div className="text-[10px] text-slate-400">В процессе проверки родителями</div>
                      </div>
                      <span className="bg-amber-100 text-amber-700 font-bold py-1 px-2.5 rounded-lg text-[10px] uppercase animate-pulse">
                        ⌛ Проверка
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Completed */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">История полученных за квесты ({kidChores.filter(c => c.status === "approved").length})</h4>
              <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs">
                {kidChores.filter(c => c.status === "approved").length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-medium">Вы еще не завершили квесты. Самое время начать! 🚀</div>
                ) : (
                  kidChores.filter(c => c.status === "approved").slice(0, 5).map((chore) => (
                    <div key={chore.id} className="p-3.5 flex justify-between items-center gap-3 text-xs">
                      <div>
                        <div className="font-bold text-slate-700 line-clamp-1">{chore.title}</div>
                        {chore.parentFeedback && (
                          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">"{chore.parentFeedback}"</div>
                        )}
                      </div>
                      <span className="font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
                        +{chore.finalPoints || chore.points} 🪙
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STORE REWARDS VIEW */}
      {activeTab === "store" && (
        <div className="space-y-6">
          {/* Marketplace search input */}
          <div className="relative w-full max-w-md bg-white p-1 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
            <div className="pl-3 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Поиск по магазину..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-transparent text-slate-800 text-xs py-2 focus:outline-none placeholder-slate-400 font-bold"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="p-1 px-2.5 text-slate-400 hover:text-slate-600 font-black text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {marketItems.filter(item => 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
          ).length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-xs text-slate-400 font-medium">
              Ничего не найдено по запросу "{searchTerm}" 🔍
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketItems.filter(item => 
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                item.description.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((item) => {
                const cannotAfford = currentUser.points < item.points;
                return (
                <div 
                  key={item.id}
                  className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-shadow relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="aspect-video w-full bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-5xl overflow-hidden">
                      {item.image.startsWith("http") ? (
                        <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        item.image
                      )}
                    </div>

                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-sm leading-tight truncate">{item.title}</h4>
                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase">Стоимость</div>
                      <div className="font-black text-amber-600 text-sm">🪙 {item.points} монет</div>
                    </div>
                    
                    <button
                      onClick={() => setConfirmPurchaseItem(item)}
                      className={`py-2 px-4 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1 cursor-pointer ${
                        cannotAfford 
                          ? "bg-slate-100 text-slate-400 border border-slate-200/50" 
                          : `${palette.bg} ${palette.hover} text-white`
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      Купить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          )}

          {/* Active kid's purchase logs */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Мои покупки на выдаче ({activeKidPurchases.length})</h4>
            <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-xs max-w-2xl">
              {activeKidPurchases.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-medium">Вы еще ничего не заказывали.</div>
              ) : (
                activeKidPurchases.map((pur) => (
                  <div key={pur.id} className="p-4 flex justify-between items-center gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        {pur.productImage && pur.productImage.startsWith("http") ? (
                          <img src={pur.productImage} alt={pur.productTitle} className="w-6 h-6 object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          pur.productImage || "🎁"
                        )}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800">{pur.productTitle}</div>
                        <div className="text-[10px] text-slate-400">Цена: 🪙 {pur.points} баллов</div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold py-1 px-2.5 rounded-lg uppercase border ${
                      pur.status === "pending" 
                        ? "bg-rose-50 text-rose-600 border-rose-100 animate-pulse" 
                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                    }`}>
                      {pur.status === "pending" ? "⏳ Ожидает выдачи" : " Получено!"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* DAILY CHECK-IN VIEW */}
      {activeTab === "daily" && (
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 animate-bounce" />
                Календарь Ежедневных Баллов
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                Заходите на сайт каждый день без пропусков! Каждый следующий день дает на 1 балл больше!
              </p>
            </div>

            <button
              onClick={handleDailyCheckIn}
              disabled={!canClaimDaily || loading}
              className={`w-full md:w-auto py-3 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer ${
                canClaimDaily 
                  ? `${palette.bg} ${palette.hover} text-white animate-pulse-ring` 
                  : "bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed"
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {canClaimDaily ? `Забрать: +${pointsToEarnToday} 🪙 монет!` : "Сегодня пройдено!"}
            </button>
          </div>

          {/* Grid check-in map (30 days) */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-3">
            {Array.from({ length: 30 }).map((_, idx) => {
              const dayNum = idx + 1;
              const points = dayNum; // Day 1 = 1 point, Day 2 = 2 points, etc
              
              // Determine status of this day
              const isClaimed = dayNum <= currentUser.dailyStreak && !canClaimDaily;
              const isToday = canClaimDaily && dayNum === currentUser.dailyStreak + 1;
              const isFuture = dayNum > currentUser.dailyStreak + (canClaimDaily ? 1 : 0);

              return (
                <div
                  key={dayNum}
                  className={`p-3 rounded-2xl border text-center flex flex-col justify-between items-center min-h-[90px] transition-all relative overflow-hidden ${
                    isClaimed 
                      ? "bg-emerald-50 border-emerald-100 text-emerald-800" 
                      : isToday 
                        ? "bg-orange-50 border-orange-300 ring-2 ring-orange-400/30 scale-105" 
                        : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <div className="text-[10px] font-black uppercase tracking-wider">День {dayNum}</div>
                  <div className="text-lg font-black my-1.5 flex flex-col items-center">
                    {isClaimed ? (
                      <Check className="w-5 h-5 text-emerald-600 font-bold" />
                    ) : (
                      <span className={isToday ? "text-orange-600 font-black" : "text-slate-400"}>🪙 +{points}</span>
                    )}
                  </div>
                  <div className="text-[9px] font-bold">
                    {isClaimed ? "Забрано" : isToday ? "Ждет вас!" : "Закрыто"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KID PROFILE VIEW */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-6 space-y-6 max-w-2xl">
            <div className="flex flex-col sm:flex-row items-center gap-5 border-b border-slate-100 pb-6">
              {/* Avatar with pencil editor */}
              <div className="relative group shrink-0">
                <div className="w-24 h-24 rounded-full bg-slate-50 border-4 border-slate-100 shadow-inner flex items-center justify-center text-5xl">
                  {currentUser.avatar}
                </div>
                <button
                  onClick={() => setEditingAvatar(true)}
                  className="absolute bottom-0 right-0 p-2 bg-slate-800 hover:bg-slate-950 text-white rounded-full shadow-lg border-2 border-white transition-all cursor-pointer text-xs"
                  title="Изменить аватарку"
                >
                  ✏️
                </button>
              </div>

              {/* Kid info */}
              <div className="text-center sm:text-left space-y-1">
                <h3 className="text-xl font-black text-slate-800 flex items-center justify-center sm:justify-start gap-1.5">
                  {currentUser.name}
                  <span className="text-xs bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full uppercase">Ребенок</span>
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  Email: {currentUser.email && !currentUser.email.endsWith("@family.local") ? currentUser.email : "Вход через Google не привязан"}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1.5">
                  <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-100">
                    🪙 {currentUser.points} монет
                  </span>
                  <span className="text-xs font-extrabold text-orange-700 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                    🔥 {currentUser.dailyStreak} дней подряд
                  </span>
                </div>
              </div>
            </div>

            {/* Avatar Select Drawer/Modal */}
            {editingAvatar && (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black text-slate-500 uppercase">Выберите новую аватарку:</h4>
                  <button 
                    onClick={() => setEditingAvatar(false)}
                    className="text-[10px] font-black text-rose-500 hover:underline cursor-pointer"
                  >
                    Закрыть
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-2 bg-white p-3 rounded-xl border border-slate-200">
                  {["🦊", "🦁", "🐯", "🐼", "🐨", "🐻", "🐶", "🐱", "🐰", "🐵", "🐸", "🐷", "🦖", "🦄", "🐙", "🦀", "🐝", "🦋", "🍄", "🌻", "🌈", "🍕", "🍔", "🍦"].map((av) => (
                    <button
                      key={av}
                      onClick={async () => {
                        try {
                          const userRef = doc(db, "users", currentUser.id);
                          await updateDoc(userRef, { avatar: av });
                          setEditingAvatar(false);
                        } catch (err) {
                          console.error("Failed to update avatar:", err);
                        }
                      }}
                      className="text-2xl p-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quests & Purchase history lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Done Quests List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Выполненные задания</h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50 max-h-72 overflow-y-auto">
                  {kidChores.filter(c => c.status === "approved").length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-400 font-medium">Нет выполненных заданий.</div>
                  ) : (
                    kidChores.filter(c => c.status === "approved").map((chore) => (
                      <div key={chore.id} className="p-3 bg-white hover:bg-slate-50/50 transition-colors flex justify-between items-center gap-3 text-xs">
                        <div className="truncate">
                          <div className="font-bold text-slate-700 truncate">{chore.title}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Выполнено</div>
                        </div>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 shrink-0">
                          +{chore.finalPoints || chore.points} 🪙
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Purchase History List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">Купленные призы</h4>
                <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50 max-h-72 overflow-y-auto">
                  {activeKidPurchases.length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-400 font-medium">Вы еще ничего не покупали.</div>
                  ) : (
                    activeKidPurchases.map((pur) => (
                      <div key={pur.id} className="p-3 bg-white hover:bg-slate-50/50 transition-colors flex justify-between items-center gap-3 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-lg bg-slate-100 p-1 rounded-md shrink-0">
                            {pur.productImage && pur.productImage.startsWith("http") ? (
                              <img src={pur.productImage} alt={pur.productTitle} className="w-5 h-5 object-cover rounded-md" referrerPolicy="no-referrer" />
                            ) : (
                              pur.productImage || "🎁"
                            )}
                          </span>
                          <div className="truncate">
                            <div className="font-bold text-slate-700 truncate">{pur.productTitle}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              {pur.status === "issued" ? "Выдано 🎉" : "Ожидает выдачи ⌛"}
                            </div>
                          </div>
                        </div>
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100 shrink-0">
                          -{pur.points} 🪙
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO REPORT / CAMERA MODAL */}
      <AnimatePresence>
        {submittingChore && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-slate-100 flex flex-col"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Сдать квест: {submittingChore.title}</h4>
                  <p className="text-[10px] text-slate-400">Прикрепите фотоотчет вашей работы</p>
                </div>
                <button 
                  onClick={() => { handleStopCamera(); setSubmittingChore(null); setProofPhotoBase64(null); }} 
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Закрыть
                </button>
              </div>

              {/* Camera view / preview content */}
              <div className="p-5 flex flex-col items-center gap-4">
                {uploadProgress ? (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
                    <div className="text-xs font-bold text-slate-600">Загрузка фотоотчета на сервер...</div>
                    <p className="text-[10px] text-slate-400">Это займет несколько секунд</p>
                  </div>
                ) : proofPhotoBase64 ? (
                  <div className="space-y-4 w-full">
                    <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
                      <img src={proofPhotoBase64} alt="Captured proof" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setProofPhotoBase64(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full text-xs transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-center text-[11px] text-slate-500 font-medium">
                      Фото выглядит отлично! Вы можете отправить его родителям.
                    </div>
                  </div>
                ) : cameraActive ? (
                  <div className="w-full space-y-4">
                    <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-300 bg-black relative">
                      <video ref={videoRef} className="w-full h-full object-cover transform -scale-x-100" playsInline muted></video>
                    </div>
                    <button
                      onClick={handleCapturePhoto}
                      className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      📸 Сделать Снимок
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 w-full py-6">
                    <button
                      onClick={handleStartCamera}
                      className="p-6 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50/50 transition-all group cursor-pointer"
                    >
                      <Camera className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600">Открыть камеру</span>
                    </button>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="p-6 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50/50 transition-all group cursor-pointer"
                    >
                      <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600">Выбрать файл</span>
                    </button>
                  </div>
                )}

                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                  className="hidden" 
                />
                
                <canvas ref={canvasRef} className="hidden"></canvas>
              </div>

              {/* Action buttons footer */}
              {proofPhotoBase64 && !uploadProgress && (
                <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                  <button
                    onClick={() => setProofPhotoBase64(null)}
                    className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold rounded-2xl text-xs transition-all cursor-pointer"
                  >
                    Переделать фото
                  </button>
                  <button
                    onClick={handleSubmitProof}
                    className={`flex-1 py-3 ${palette.bg} ${palette.hover} text-white font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer`}
                  >
                    Отправить маме ✅
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PURCHASE CONFIRMATION MODAL */}
      <AnimatePresence>
        {confirmPurchaseItem && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4"
            >
              <div className="inline-flex p-4 bg-amber-50 rounded-full text-amber-500 text-4xl shadow-inner animate-bounce">
                {confirmPurchaseItem.image.startsWith("http") ? "🎁" : confirmPurchaseItem.image}
              </div>
              
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-base">Подтверждение покупки</h4>
                <p className="text-slate-500 text-xs leading-normal">
                  Вы действительно хотите купить <b>{confirmPurchaseItem.title}</b> за <span className="font-bold text-amber-600">🪙 {confirmPurchaseItem.points} монет</span>?
                </p>
              </div>

              <div className="bg-amber-50 p-3.5 border border-amber-100 rounded-2xl text-xs flex justify-between items-center">
                <span className="text-slate-600">Ваш баланс: <b>🪙 {currentUser.points}</b></span>
                <span className="text-slate-600">Останется: <b>🪙 {currentUser.points - confirmPurchaseItem.points}</b></span>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setConfirmPurchaseItem(null)}
                  className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-200 font-bold rounded-2xl text-xs transition-all cursor-pointer"
                >
                  Отмена
                </button>
                <button
                  onClick={handleBuyItem}
                  disabled={loading}
                  className={`flex-1 py-3 ${palette.bg} ${palette.hover} text-white font-bold rounded-2xl text-xs transition-all shadow-sm cursor-pointer`}
                >
                  Купить! 🚀
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
