import React, { useState, useEffect, useRef } from "react";
import { Chore, FamilyUser, MarketItem, Purchase, SiteSettings, Transaction } from "../types";
import { db } from "../firebase";
import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore";
import { 
  Sparkles, Award, Clock, Camera, Check, ShoppingBag, 
  Trash2, Flame, Gift, Compass, ShieldAlert, CheckCircle, 
  X, AlertCircle, RefreshCw, Upload, Image as ImageIcon, User, Search, Send
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TAILWIND_COLOR_PALETTES, DEFAULT_CATEGORIES } from "../presets";
import { uploadImageToImgbb, compressImageFile } from "../utils/upload";
import { sendTelegramNotification } from "../utils/telegram";

interface KidDashboardProps {
  currentUser: FamilyUser;
  kids?: FamilyUser[];
  chores: Chore[];
  marketItems: MarketItem[];
  purchases: Purchase[];
  transactions: Transaction[];
  settings: SiteSettings;
  primaryColor: keyof typeof TAILWIND_COLOR_PALETTES;
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
  activeTab?: "quests" | "store" | "daily" | "profile";
  setActiveTab?: (tab: "quests" | "store" | "daily" | "profile") => void;
}

export default function KidDashboard({
  currentUser,
  kids = [],
  chores,
  marketItems,
  purchases,
  transactions = [],
  settings,
  primaryColor,
  showAlert,
  showConfirm,
  activeTab: externalActiveTab,
  setActiveTab: externalSetActiveTab
}: KidDashboardProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<"quests" | "store" | "daily" | "profile">("quests");
  const activeTab = externalActiveTab !== undefined ? externalActiveTab : internalActiveTab;
  const setActiveTab = externalSetActiveTab !== undefined ? externalSetActiveTab : setInternalActiveTab;

  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [editingAvatar, setEditingAvatar] = useState(false);

  const [kidTelegramId, setKidTelegramId] = useState(currentUser.telegramChatId || "");
  const [loadingTelegram, setLoadingTelegram] = useState(false);

  useEffect(() => {
    setKidTelegramId(currentUser.telegramChatId || "");
  }, [currentUser.telegramChatId]);

  const handleSaveKidTelegramId = async () => {
    if (loadingTelegram) return;
    setLoadingTelegram(true);
    try {
      const userRef = doc(db, "users", currentUser.id);
      await updateDoc(userRef, {
        telegramChatId: kidTelegramId.trim()
      });
      showAlert("Успешно 🎉", "Ваш Telegram ID сохранен! Теперь вы будете получать уведомления.");
    } catch (err) {
      console.error("Failed to update telegram ID:", err);
      showAlert("Ошибка", "Не удалось сохранить Telegram ID.");
    } finally {
      setLoadingTelegram(false);
    }
  };

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
  const [compressingFile, setCompressingFile] = useState(false);

  // Shop confirmation modal state
  const [confirmPurchaseItem, setConfirmPurchaseItem] = useState<MarketItem | null>(null);

  const [transferTargetId, setTransferTargetId] = useState("");
  const [timeLeftToNextDay, setTimeLeftToNextDay] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const gmt5Now = new Date(new Date().getTime() + 5 * 60 * 60 * 1000);
      const nextMidnight = new Date(gmt5Now);
      nextMidnight.setUTCHours(24, 0, 0, 0); // Next midnight in GMT+5
      const diff = nextMidnight.getTime() - gmt5Now.getTime();
      
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      setTimeLeftToNextDay(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const [transferAmount, setTransferAmount] = useState("");
  const [loadingTransfer, setLoadingTransfer] = useState(false);

  const handleTransferCoins = async () => {
    const amount = Number(transferAmount);
    if (!transferTargetId || isNaN(amount) || amount <= 0 || amount > 100) {
      showAlert("Ошибка", "Некорректная сумма перевода (максимум 100).");
      return;
    }
    if (currentUser.points < amount) {
      showAlert("Не хватает монет", "У вас недостаточно монет для перевода.");
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const todayTransfers = transactions.filter(t => 
      t.kidId === currentUser.id && 
      t.type === "expense" && 
      t.title.includes("Перевод") && 
      (t.createdAt as any)?.toDate?.()?.toISOString().split('T')[0] === today
    );
    const todayTransferredAmount = todayTransfers.reduce((acc, t) => acc + t.amount, 0);
    if (todayTransferredAmount + amount > 100) {
      showAlert("Превышен лимит", `Вы можете перевести еще максимум ${100 - todayTransferredAmount} монет сегодня.`);
      return;
    }

    setLoadingTransfer(true);
    try {
      const targetKid = kids.find(k => k.id === transferTargetId);
      if (!targetKid) throw new Error("Target kid not found");

      // Update current user (sender)
      const newSenderBalance = currentUser.points - amount;
      await updateDoc(doc(db, "users", currentUser.id), { points: newSenderBalance });

      // Update target kid (receiver)
      const newReceiverBalance = targetKid.points + amount;
      await updateDoc(doc(db, "users", targetKid.id), { points: newReceiverBalance });

      // Log transaction for sender
      const txSenderId = "tx-transfer-out-" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "transactions", txSenderId), {
        id: txSenderId,
        kidId: currentUser.id,
        kidName: currentUser.name,
        type: "expense",
        amount: amount,
        title: `Перевод для ${targetKid.name}`,
        createdAt: new Date(),
        balanceAfter: newSenderBalance
      });

      // Log transaction for receiver
      const txReceiverId = "tx-transfer-in-" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "transactions", txReceiverId), {
        id: txReceiverId,
        kidId: targetKid.id,
        kidName: targetKid.name,
        type: "income",
        amount: amount,
        title: `Перевод от ${currentUser.name}`,
        createdAt: new Date(),
        balanceAfter: newReceiverBalance
      });

      showAlert("Успешно!", `Вы перевели ${amount} монет для ${targetKid.name}.`);
      setTransferAmount("");
      setTransferTargetId("");
    } catch (err) {
      console.error(err);
      showAlert("Ошибка", "Не удалось перевести монеты.");
    } finally {
      setLoadingTransfer(false);
    }
  };

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const palette = TAILWIND_COLOR_PALETTES[primaryColor] || TAILWIND_COLOR_PALETTES.indigo;

  // Filtrations
  const kidChores = chores.filter(c => c.assignedTo.includes(currentUser.id));
  const activeKidPurchases = purchases.filter(p => p.kidId === currentUser.id);

  const sortedFilteredItems = marketItems
    .filter(item => {
      if (item.hidden) return false;
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "" || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const oA = a.sortOrder ?? 0;
      const oB = b.sortOrder ?? 0;
      if (oA !== oB) return oA - oB;
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return tB - tA;
    });

  // 1. Daily Check-in Claim logic
  // Use GMT+5 for date tracking
  const gmt5Now = new Date(now.getTime() + 5 * 60 * 60 * 1000);
  const todayStr = gmt5Now.toISOString().split("T")[0]; // YYYY-MM-DD
  const canClaimDaily = currentUser.lastCheckIn !== todayStr;
  
  // Calculate if the streak is broken:
  // If last check-in exists, and it's not today, and it's not yesterday, then the streak is broken!
  let isStreakBroken = false;
  let yesterdayStr = "";
  {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterdayStr = yesterday.toISOString().split("T")[0];
    
    if (currentUser.lastCheckIn && currentUser.lastCheckIn !== todayStr && currentUser.lastCheckIn !== yesterdayStr) {
      isStreakBroken = true;
    }
  }

  const nextClaimDayNum = canClaimDaily ? (currentUser.dailyStreak + 1) : currentUser.dailyStreak;
  // If streak exceeds 30, mod it or keep it growing
  const pointsToEarnToday = nextClaimDayNum;

  const handleDailyCheckIn = async () => {
    if (!canClaimDaily || isStreakBroken || loading) return;

    setLoading(true);
    try {
      const kidRef = doc(db, "users", currentUser.id);
      const newStreak = currentUser.dailyStreak + 1;
      
      let basePoints = pointsToEarnToday;
      let chestPoints = 0;
      let isChestDay = false;
      
      if (newStreak === 15 || newStreak === 30) {
        chestPoints = Math.floor(Math.random() * 50) + 1; // 1 to 50 random coins
        isChestDay = true;
      }
      
      let wonMarketItem = null;
      if (newStreak === 29) {
        // Random prize from market
        if (marketItems.length > 0) {
           wonMarketItem = marketItems[Math.floor(Math.random() * marketItems.length)];
           isChestDay = true;
        }
      }
      
      const totalEarnedToday = basePoints + chestPoints;
      
      if (wonMarketItem) {
        const purchaseId = "purchase-" + Math.random().toString(36).substr(2, 9);
        const newPurchase: Purchase = {
          id: purchaseId,
          productId: wonMarketItem.id,
          productTitle: wonMarketItem.title,
          productImage: wonMarketItem.image,
          points: 0, // Free prize
          kidId: currentUser.id,
          kidName: currentUser.name,
          status: "pending",
          createdAt: new Date()
        };
        await setDoc(doc(db, "purchases", purchaseId), newPurchase);
        
        if (settings.telegramChatId) {
          await sendTelegramNotification(
            `🎁 <b>Ребенок выиграл приз из магазина!</b>\nРебенок: ${currentUser.name} ${currentUser.avatar}\nДень: 29\nПриз: <b>${wonMarketItem.title}</b>\n\n<i>Выдайте его в админ-панели!</i>`,
            settings.telegramChatId
          );
        }
      }
      const newBalance = currentUser.points + totalEarnedToday;

      await updateDoc(kidRef, {
        points: newBalance,
        dailyStreak: newStreak,
        lastCheckIn: todayStr
      });

      // Log transaction
      const txId = "tx-daily-" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "transactions", txId), {
        id: txId,
        kidId: currentUser.id,
        kidName: currentUser.name,
        type: "income",
        amount: totalEarnedToday,
        title: `Ежедневный бонус: День ${newStreak}`,
        createdAt: new Date(),
        balanceAfter: newBalance
      });

      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `🔥 <b>Ежедневная отметка!</b>\nРебенок: ${currentUser.name} ${currentUser.avatar}\nСерия: <b>${newStreak} дней подряд!</b>\nПолучено сегодня: 🪙 <b>+${totalEarnedToday} баллов</b>${isChestDay ? ` (из них 🎁 +${chestPoints} из Сундука!)` : ""}`,
          settings.telegramChatId
        );
      }

      if (isChestDay) {
        showAlert(
          "ОТКРЫТ СУНДУК! 🎁🎉",
          `Ты успешно отметился на ${newStreak}-й день! Тебе начислено ${basePoints} монет за серию, а также ты открыл Сундук и получил еще +${chestPoints} монет! Итого получено: +${totalEarnedToday} монет! Ура!`
        );
      } else {
        showAlert("Поздравляем! 🎉", `Вы забрали ежедневную награду: +${totalEarnedToday} монет! Ваша серия: ${newStreak} дн.!`);
      }
    } catch (err) {
      console.error("Daily checkin failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreStreak = async () => {
    if (loading) return;
    const gmt5Now = new Date(new Date().getTime() + 5 * 60 * 60 * 1000);

    const currentMonthStr = `${gmt5Now.getFullYear()}-${String(gmt5Now.getMonth() + 1).padStart(2, '0')}`;
    const restoresUsed = (currentUser.lastRestoreMonth === currentMonthStr) 
      ? (currentUser.restoresUsedThisMonth || 0) 
      : 0;

    if (restoresUsed >= 5) {
      showAlert("Лимит исчерпан", "Вы исчерпали лимит в 5 восстановлений в этом месяце.");
      return;
    }

    const isFree = restoresUsed === 0;
    const cost = isFree ? 0 : 200 * Math.pow(2, restoresUsed - 1);

    if (currentUser.points < cost) {
      showAlert("Недостаточно монет 🪙", `Восстановление стоит ${cost} монет. У вас недостаточно средств.`);
      return;
    }

    setLoading(true);
    try {
      const yesterday = new Date(gmt5Now.getTime() - 24 * 60 * 60 * 1000);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const kidRef = doc(db, "users", currentUser.id);
      
      const updatedFields: any = {
        lastCheckIn: yesterdayStr,
        restoresUsedThisMonth: restoresUsed + 1,
        lastRestoreMonth: currentMonthStr
      };

      if (!isFree) {
        updatedFields.points = currentUser.points - cost;
      }

      await updateDoc(kidRef, updatedFields);

      // Log transaction if paid restore
      if (!isFree) {
        const txId = "tx-restore-" + Math.random().toString(36).substr(2, 9);
        await setDoc(doc(db, "transactions", txId), {
          id: txId,
          kidId: currentUser.id,
          kidName: currentUser.name,
          type: "expense",
          amount: cost,
          title: "Восстановление серии ежедневных отметок",
          createdAt: new Date(),
          balanceAfter: currentUser.points - cost
        });
      }

      showAlert("Ура! 🎉", isFree 
        ? "Твоя серия восстановлена бесплатно! Теперь можешь отметиться за сегодня! ⚡"
        : `Твоя серия восстановлена за 200 монет! Теперь можешь отметиться за сегодня! 🪙`
      );
    } catch (err) {
      console.error("Streak restore failed:", err);
      showAlert("Ошибка", "Не удалось восстановить серию. Попробуйте еще раз.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetStreakAndStartOver = async () => {
    setLoading(true);
    try {
      const kidRef = doc(db, "users", currentUser.id);
      await updateDoc(kidRef, {
        dailyStreak: 0,
        lastCheckIn: "" // clear checkin to allow claim immediately
      });
      showAlert("Сброшено!", "Серия сброшена. Ты можешь начать забирать награды с Дня 1! Удачи! 🚀");
    } catch (err) {
      console.error("Reset streak failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Chore Status interactions
  const handleAcceptChore = async (choreId: string, title: string) => {
    try {
      const choreRef = doc(db, "chores", choreId);
      const chore = chores.find(c => c.id === choreId);
      const limitMinutes = chore?.executionLimitMinutes || 60;
      const deadlineAt = new Date(Date.now() + limitMinutes * 60 * 1000);

      await updateDoc(choreRef, {
        status: "accepted",
        acceptedBy: currentUser.id,
        acceptedAt: new Date(),
        deadlineAt: deadlineAt
      });

      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `🏃 <b>Квест принят в работу!</b>\nРебенок: ${currentUser.name} ${currentUser.avatar}\nКвест: <b>${title}</b>\n\n<i>Время на выполнение: ${limitMinutes} минут!</i>`,
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
          const chore = chores.find(c => c.id === choreId);
          if (chore) {
            const newAssignedTo = chore.assignedTo.filter(id => id !== currentUser.id);
            if (newAssignedTo.length === 0) {
              await updateDoc(choreRef, {
                status: "declined",
                assignedTo: newAssignedTo
              });
            } else {
              await updateDoc(choreRef, {
                assignedTo: newAssignedTo
              });
            }
          }

          if (settings.telegramChatId) {
            await sendTelegramNotification(
              `⚠️ <b>Ребенок отказался от квеста!</b>\nРебенок: ${currentUser.name} ${currentUser.avatar}\nКвест: <b>${title}</b>`,
              settings.telegramChatId
            );
          }
        } catch (err) {
          console.error("Decline chore failed:", err);
        }
      }
    );
  };

  const handleCancelActiveChore = async (choreId: string, title: string) => {
    showConfirm(
      "Штраф за отмену квеста 🪙",
      "ВНИМАНИЕ! Вы действительно хотите отменить этот активный квест? За отмену принятого в работу задания спишется штраф в размере 20 монет 🪙 с вашего баланса!",
      async () => {
        setLoading(true);
        try {
          const newPoints = currentUser.points - 20;
          const kidRef = doc(db, "users", currentUser.id);
          await updateDoc(kidRef, { points: newPoints });

          const choreRef = doc(db, "chores", choreId);
          await updateDoc(choreRef, {
            status: "declined",
            acceptedBy: null
          });

          // Log transaction
          const txId = "tx-cancel-" + Math.random().toString(36).substr(2, 9);
          await setDoc(doc(db, "transactions", txId), {
            id: txId,
            kidId: currentUser.id,
            kidName: currentUser.name,
            type: "expense",
            amount: 20,
            title: `Штраф за отмену квеста: ${title}`,
            createdAt: new Date(),
            balanceAfter: newPoints
          });

          if (settings.telegramChatId) {
            await sendTelegramNotification(
              `⚠️ <b>Квест отменен ребенком! Списано 20 монет штрафа!</b>\nРебенок: ${currentUser.name} ${currentUser.avatar}\nКвест: <b>${title}</b>\nНовый баланс: 🪙 <b>${newPoints} монет</b>`,
              settings.telegramChatId
            );
          }

          showAlert("Внимание ⚠️", "Вы отменили принятое задание. С вашего счета списано 20 монет штрафа.");
        } catch (err) {
          console.error("Failed to cancel active chore:", err);
          showAlert("Ошибка", "Не удалось отменить задание: " + err);
        } finally {
          setLoading(false);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCompressingFile(true);
      try {
        const compressedBase64 = await compressImageFile(file, 1024, 1024, 0.8);
        if (compressedBase64) {
          setProofPhotoBase64(compressedBase64);
        } else {
          throw new Error("Empty compressed image output");
        }
      } catch (err) {
        console.error("Image compression failed, trying fallback FileReader:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setProofPhotoBase64(reader.result as string);
        };
        reader.readAsDataURL(file);
      } finally {
        setCompressingFile(false);
      }
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
          `📸 <b>Отчет по заданию отправлен!</b>\nРебенок: ${currentUser.name} ${currentUser.avatar}\nКвест: <b>${submittingChore.title}</b>\n\n<i>Родители, пожалуйста, проверьте отчет и оцените старания!</i>`,
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

    const isDiscounted = item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now());
    const finalPrice = isDiscounted ? Math.max(1, Math.floor(item.points * (1 - item.discountPercentage! / 100))) : item.points;

    if (currentUser.points < finalPrice) {
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
      const newPoints = currentUser.points - finalPrice;
      await updateDoc(kidRef, { points: newPoints });

      // Log transaction
      const txId = "tx-buy-" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "transactions", txId), {
        id: txId,
        kidId: currentUser.id,
        kidName: currentUser.name,
        type: "expense",
        amount: finalPrice,
        title: `Покупка товара: ${item.title}`,
        createdAt: new Date(),
        balanceAfter: newPoints
      });

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
        points: finalPrice,
        kidId: currentUser.id,
        kidName: currentUser.name,
        status: "pending",
        createdAt: new Date()
      };

      await setDoc(doc(db, "purchases", purchaseId), newPurchase);

      // 4. Send Telegram notification to parent
      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `🎉 <b>Новая покупка в Маркете!</b>\nПокупатель: ${currentUser.name} ${currentUser.avatar}\nПриз: <b>${item.title}</b>\nСписано: 🪙 <b>${finalPrice} монет</b>\n\n<i>Родители, пожалуйста, подтвердите выдачу в админ-панели!</i>`,
          settings.telegramChatId
        );
      }

      showAlert("Поздравляем! 🎉", `Успешно куплено! 🎉 С вашего счета списано ${finalPrice} монет. Ваша заявка успешно принята, ждите подтверждения!`);
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
        <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white rounded-3xl p-4 flex flex-col justify-between shadow-md relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 text-7xl select-none opacity-15 group-hover:scale-110 transition-transform">🪙</div>
          <div className="flex justify-between items-start z-10 relative">
            <div>
              <div className="text-[9px] font-black text-amber-100 uppercase tracking-wider">Мой баланс</div>
              <div className="text-xl md:text-3xl font-black mt-0.5 tracking-tight">🪙 {currentUser.points}</div>
            </div>
            <button 
              onClick={() => setInternalActiveTab("profile")}
              className="p-2 bg-black/10 hover:bg-black/20 rounded-xl transition-colors cursor-pointer"
              title="История операций"
            >
              <RefreshCw className="w-5 h-5 text-white/90" />
            </button>
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

                    <div className="space-y-2">
                      <button
                        onClick={() => setSubmittingChore(chore)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" /> Сдать отчет (фотоотчет) 📸
                      </button>
                      <button
                        onClick={() => handleCancelActiveChore(chore.id, chore.title)}
                        className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 text-rose-600 text-[10px] font-black rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer uppercase tracking-wider"
                      >
                        ⚠️ Отменить квест (-20 🪙)
                      </button>
                    </div>
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
          {/* Marketplace search input & Category Horizontal Tab List */}
          <div className="space-y-4">
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

            {/* Category Filter Pills (Horizontal Scrolling list) */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
              <button
                onClick={() => setSelectedCategory("")}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === ""
                    ? `${palette.bg} text-white shadow-xs`
                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                🚀 Все товары
              </button>
              {(settings.categories || DEFAULT_CATEGORIES).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? `${palette.bg} text-white shadow-xs`
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  🏷️ {cat}
                </button>
              ))}
            </div>
          </div>

          {sortedFilteredItems.length === 0 ? (
            <div className="p-12 text-center bg-white border border-dashed border-slate-200 rounded-3xl text-xs text-slate-400 font-medium shadow-2xs">
              Ничего не найдено в этой категории 🔍
            </div>
          ) : (
            /* Display 2 products per row on mobile to fit nicely! */
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {sortedFilteredItems.map((item) => {
                const cannotAfford = currentUser.points < item.points;
                return (
                  <div 
                    key={item.id}
                    className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-2.5 sm:p-5 shadow-xs flex flex-col justify-between gap-2.5 sm:gap-4 hover:shadow-sm transition-all relative overflow-hidden"
                  >
                    {/* Pinned label or Category Badge */}
                    <div className="absolute top-1.5 left-1.5 z-10 flex flex-wrap gap-1">
                      {item.pinned && (
                        <span className="bg-amber-400 text-slate-900 font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-0.5 shadow-sm">
                          📌 ЗАКРЕПЛЕНО
                        </span>
                      )}
                      {item.category && (
                        <span className="bg-slate-100 text-slate-600 font-bold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md">
                          {item.category}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 sm:space-y-3">
                      <div className="aspect-video w-full bg-slate-50 border border-slate-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-3xl sm:text-5xl overflow-hidden relative">
                        {item.image.startsWith("http") ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          item.image
                        )}
                        {item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now()) && (
                          <div className="absolute top-2 right-2 bg-rose-500 text-white font-black text-[10px] px-2 py-1 rounded-lg animate-pulse shadow-md border border-rose-400">
                            -{item.discountPercentage}% СКИДКА!
                          </div>
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm leading-tight truncate">{item.title}</h4>
                        <p className="text-slate-400 text-[10px] sm:text-xs line-clamp-2 leading-relaxed h-7 sm:h-8">{item.description || "Без описания"}</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2 sm:pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                      <div>
                        <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase">Стоимость</div>
                        {item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now()) ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-rose-600 text-xs sm:text-sm">🪙 {Math.max(1, Math.floor(item.points * (1 - item.discountPercentage / 100)))}</span>
                            <span className="font-bold text-slate-400 text-[9px] sm:text-[10px] line-through">🪙 {item.points}</span>
                          </div>
                        ) : (
                          <div className="font-black text-amber-600 text-xs sm:text-sm">🪙 {item.points} монет</div>
                        )}
                      </div>
                      
                      <button
                        onClick={() => setConfirmPurchaseItem(item)}
                        className={`w-full sm:w-auto py-1.5 sm:py-2 px-2.5 sm:px-4 text-[10px] sm:text-xs font-black rounded-lg sm:rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer ${
                          (() => {
                            const isDiscounted = item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now());
                            const finalPrice = isDiscounted ? Math.max(1, Math.floor(item.points * (1 - item.discountPercentage! / 100))) : item.points;
                            return currentUser.points < finalPrice;
                          })() 
                            ? "bg-slate-100 text-slate-400 border border-slate-200/50" 
                            : `${palette.bg} ${palette.hover} text-white`
                        }`}
                      >
                        <Gift className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
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
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-4 sm:p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-50 pb-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500 animate-bounce" />
                Календарь Ежедневных Баллов
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                Заходите на сайт каждый день! На 15-й и 30-й день вас ждет особый 📦 <b>Сундук с сюрпризом</b> (дополнительно от 1 до 50 монет)!
              </p>
            </div>

            {!isStreakBroken && (
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
                {canClaimDaily ? `Забрать: +${pointsToEarnToday} 🪙 монет!` : `Жди новый день: ${timeLeftToNextDay}`}
              </button>
            )}
          </div>

          {/* Streak Broken Section */}
          {isStreakBroken && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="space-y-1">
                <h4 className="font-extrabold text-rose-700 text-sm flex items-center gap-1.5">
                  😢 Твоя серия прервалась!
                </h4>
                <p className="text-xs text-rose-600 leading-normal max-w-xl">
                  Ты пропустил день! Чтобы продолжить получать увеличенные награды, восстанови серию.
                  Каждый месяц дается <b>2 бесплатных восстановления</b>, а следующие стоят <b>200 монет 🪙</b>.
                </p>
                <div className="text-[10px] font-bold text-rose-500 pt-0.5 uppercase tracking-wider">
                  Использовано в этом месяце: {currentUser.lastRestoreMonth === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` ? (currentUser.restoresUsedThisMonth || 0) : 0} из 2 восстановлений
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
                <button
                  onClick={handleRestoreStreak}
                  disabled={loading}
                  className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                >
                  ⚡ Восстановить ({ (currentUser.lastRestoreMonth === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` ? (currentUser.restoresUsedThisMonth || 0) : 0) < 2 ? "Бесплатно!" : "200 монет" })
                </button>
                <button
                  onClick={handleResetStreakAndStartOver}
                  disabled={loading}
                  className="py-2.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                >
                  🔄 Начать заново (с Дня 1)
                </button>
              </div>
            </motion.div>
          )}

          {/* Grid check-in map (30 days) */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-2 sm:gap-3">
            {Array.from({ length: 30 }).map((_, idx) => {
              const dayNum = idx + 1;
              const points = dayNum; // Day 1 = 1 point, Day 2 = 2 points, etc
              
              // Determine status of this day
              const isClaimed = dayNum <= currentUser.dailyStreak && !canClaimDaily;
              const isToday = !isStreakBroken && canClaimDaily && dayNum === currentUser.dailyStreak + 1;
              const isFuture = dayNum > currentUser.dailyStreak + (!isStreakBroken && canClaimDaily ? 1 : 0);
              const isChestDay = dayNum === 15 || dayNum === 30;

              return (
                <div
                  key={dayNum}
                  className={`p-2 sm:p-3 rounded-2xl border text-center flex flex-col justify-between items-center min-h-[95px] sm:min-h-[110px] transition-all relative overflow-hidden ${
                    isClaimed 
                      ? "bg-emerald-700 border-emerald-800 text-white font-bold shadow-xs" 
                      : isToday 
                        ? "bg-orange-50 border-orange-300 ring-2 ring-orange-400/30 scale-105" 
                        : "bg-slate-50/70 border-slate-100 text-slate-400"
                  }`}
                >
                  <div className={`text-[9px] font-black uppercase tracking-wider ${isClaimed ? "text-emerald-100" : "text-slate-500"}`}>День {dayNum}</div>
                  
                  <div className="my-1.5 flex flex-col items-center">
                    {isClaimed ? (
                      <div className="flex flex-col items-center gap-0.5">
                        <Check className="w-5 h-5 text-white font-bold stroke-[3px]" />
                        <span className="text-[8px] font-extrabold text-emerald-100 uppercase">Забрано</span>
                      </div>
                    ) : isChestDay ? (
                      <div className="flex flex-col items-center">
                        {settings.chestImageUrl && (settings.chestImageUrl.startsWith("http") || settings.chestImageUrl.startsWith("data:")) ? (
                          <img 
                            src={settings.chestImageUrl} 
                            alt="Chest" 
                            className="w-8 h-8 object-contain animate-bounce" 
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="text-2xl animate-bounce" title="Сундук!">📦</span>
                        )}
                        <span className="text-[8px] font-black text-amber-600 uppercase mt-0.5">Сундук!</span>
                      </div>
                    ) : (
                      <span className={`text-xs sm:text-sm font-black ${isToday ? "text-orange-600 font-black" : "text-slate-400"}`}>
                        🪙 +{points}
                      </span>
                    )}
                  </div>

                  <div className="text-[8px] sm:text-[9px] font-bold text-center leading-tight">
                    {isClaimed ? (
                      <span className="text-emerald-100">Готово!</span>
                    ) : isToday ? (
                      <span className="text-orange-600 animate-pulse">Забрать!</span>
                    ) : isChestDay ? (
                      <span className="text-amber-600 font-black">+{dayNum} + 📦 (1-50)</span>
                    ) : (
                      <span className="text-slate-400">Закрыто</span>
                    )}
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

            {/* Kid's Telegram Settings */}
            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 space-y-3 shadow-xs">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-sky-500" /> Telegram Оповещения для тебя
              </h4>
              <p className="text-[11px] text-slate-500 leading-normal">
                Введи свой Telegram Chat ID, чтобы получать личные сообщения от нашего бота при появлении новых квестов и выплате монет! Найти Chat ID можно в ботах типа <code>@userinfobot</code> или <code>@GetMyChatID_Bot</code>.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={kidTelegramId}
                  onChange={(e) => setKidTelegramId(e.target.value)}
                  placeholder="Например: 582910482"
                  className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
                />
                <button
                  onClick={handleSaveKidTelegramId}
                  disabled={loadingTelegram}
                  className={`px-4 py-2.5 ${palette.bg} ${palette.hover} text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0`}
                >
                  {loadingTelegram ? "..." : "Сохранить 💾"}
                </button>
              </div>
            </div>

            {/* Transfer Coins Section */}
            {kids.length > 0 && (
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-3xl p-5 space-y-3 shadow-xs mt-4">
                <h4 className="text-xs font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5" /> Перевести монеты
                </h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Вы можете перевести свои монеты брату или сестре. Максимум 100 монет в день.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Выберите кому...</option>
                    {kids.map(k => (
                      <option key={k.id} value={k.id}>{k.avatar} {k.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    placeholder="Сумма (макс 100)"
                    className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleTransferCoins}
                    disabled={loadingTransfer || !transferTargetId || !transferAmount || Number(transferAmount) <= 0}
                    className={`px-4 py-2.5 ${palette.bg} ${palette.hover} text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loadingTransfer ? "..." : "Перевести 💸"}
                  </button>
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

            {/* Transaction History Log */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                📈 История операций (баланс)
              </h4>
              <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-100 bg-slate-50 max-h-80 overflow-y-auto">
                {transactions.filter(t => t.kidId === currentUser.id).length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-semibold bg-white">
                    История операций пуста. Зарабатывайте монеты на квестах! 💪
                  </div>
                ) : (
                  transactions.filter(t => t.kidId === currentUser.id).map((tx) => {
                    const isIncome = tx.type === "income";
                    let dateStr = "Неизвестно";
                    if (tx.createdAt) {
                      try {
                        const dateObj = tx.createdAt.toDate ? tx.createdAt.toDate() : new Date(tx.createdAt);
                        dateStr = dateObj.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
                      } catch (e) {
                        console.error(e);
                      }
                    }
                    return (
                      <div key={tx.id} className="p-3 bg-white hover:bg-slate-50/50 transition-colors flex justify-between items-center gap-3 text-xs">
                        <div className="space-y-0.5 truncate text-left">
                          <div className="font-extrabold text-slate-700 truncate">{tx.title}</div>
                          <div className="text-[9px] text-slate-400 flex items-center gap-1.5 font-bold">
                            <span>{dateStr}</span>
                            <span>•</span>
                            <span className="text-slate-500 font-extrabold">Остаток: {tx.balanceAfter} 🪙</span>
                          </div>
                        </div>
                        <span className={`font-black px-2.5 py-1 rounded-lg text-[11px] shrink-0 ${
                          isIncome 
                            ? "text-emerald-700 bg-emerald-50 border border-emerald-100" 
                            : "text-rose-700 bg-rose-50 border border-rose-100"
                        }`}>
                          {isIncome ? "+" : "-"}{tx.amount} 🪙
                        </span>
                      </div>
                    );
                  })
                )}
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
                ) : compressingFile ? (
                  <div className="py-12 flex flex-col items-center gap-3">
                    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
                    <div className="text-xs font-bold text-slate-600">Оптимизация и сжатие фото...</div>
                    <p className="text-[10px] text-slate-400">Уменьшаем размер картинки для быстрой отправки 🚀</p>
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
                      <video ref={videoRef} className="w-full h-full object-cover" playsInline muted></video>
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

                    <label className="p-6 border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-3xl flex flex-col items-center justify-center gap-2 hover:bg-slate-50/50 transition-all group cursor-pointer">
                      <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-indigo-500" />
                      <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600">Выбрать файл</span>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept="image/*" 
                        onChange={handleFileSelect} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                )}
                
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
