import React, { useState, useEffect, useRef, useMemo } from "react";
import { AppNotification, Chore, FamilyUser, MarketItem, Purchase, SiteSettings, Transaction } from "../types";
import { db } from "../firebase";
import { collection, addDoc, updateDoc, doc, setDoc, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { checkAchievement, ACHIEVEMENTS } from "../achievements";
import { 
  Sparkles, Plus, Check, Clock, Eye, AlertCircle, Trash2, 
  Tag, ShoppingBag, Award, Camera, CornerDownRight, ThumbsUp, ThumbsDown, RefreshCw,
  Pencil, X, Pin, EyeOff, ArrowUp, ArrowDown, BarChart2, Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DEFAULT_CHORE_PRESETS, TAILWIND_COLOR_PALETTES, DEFAULT_CATEGORIES } from "../presets";
import { sendTelegramNotification } from "../utils/telegram";
import { uploadImageToImgbb, compressImageFile } from "../utils/upload";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

interface ParentDashboardProps {
  currentUser: FamilyUser;
  kids: FamilyUser[];
  chores: Chore[];
  marketItems: MarketItem[];
  purchases: Purchase[];
  transactions: Transaction[];
  notifications: AppNotification[];
  settings: SiteSettings;
  primaryColor: keyof typeof TAILWIND_COLOR_PALETTES;
  showAlert: (title: string, message: string, image?: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void) => void;
}

export default function ParentDashboard({
  currentUser,
  kids,
  chores,
  marketItems,
  purchases,
  transactions = [],
  notifications = [],
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
  const [choreExecutionLimit, setChoreExecutionLimit] = useState(60);
  const [choreUrgent, setChoreUrgent] = useState(false);
  const [choreWeekly, setChoreWeekly] = useState(false);
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
  const [itemDiscount, setItemDiscount] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const compressedBase64 = await compressImageFile(file, 1024, 1024, 0.8);
      if (!compressedBase64) {
        throw new Error("Could not compress image");
      }
      const uploadedUrl = await uploadImageToImgbb(compressedBase64);
      if (uploadedUrl) {
        setItemImage(uploadedUrl);
        showAlert("Успешно 🎉", "Изображение успешно загружено на сервер!");
      } else {
        setItemImage(compressedBase64); // Fallback to base64
        showAlert("Предупреждение", "Загрузка на сервер не удалась, но изображение сохранено локально!");
      }
    } catch (err) {
      console.error("Failed to compress or upload image:", err);
      showAlert("Ошибка", "Произошла ошибка при обработке и загрузке картинки.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Editing market item state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemDesc, setEditItemDesc] = useState("");
  const [editItemCost, setEditItemCost] = useState(20);
  const [editItemImage, setEditItemImage] = useState("🎁");
  const [editItemStock, setEditItemStock] = useState(5);
  const [editItemDiscount, setEditItemDiscount] = useState("");
  const [editUploadingImage, setEditUploadingImage] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Category & pinning state for creation
  const [itemCategory, setItemCategory] = useState("");
  const [parentMarketCategoryFilter, setParentMarketCategoryFilter] = useState("");
  const [itemPinned, setItemPinned] = useState(false);
  const [itemHidden, setItemHidden] = useState(false);

  // Category & pinning state for editing
  const [editItemCategory, setEditItemCategory] = useState("");
  const [editItemPinned, setEditItemPinned] = useState(false);
  const [editItemHidden, setEditItemHidden] = useState(false);
  const [isCreateChoreModalOpen, setIsCreateChoreModalOpen] = useState(false);
  const [itemRequiresInput, setItemRequiresInput] = useState(false);
  const [itemIsChest, setItemIsChest] = useState(false);
  const [itemChestMin, setItemChestMin] = useState(1);
  const [itemChestMax, setItemChestMax] = useState(50);
  const [itemInputLabel, setItemInputLabel] = useState("");
  const [editItemRequiresInput, setEditItemRequiresInput] = useState(false);
  const [editItemIsChest, setEditItemIsChest] = useState(false);
  const [editItemChestMin, setEditItemChestMin] = useState(1);
  const [editItemChestMax, setEditItemChestMax] = useState(50);
  const [editItemInputLabel, setEditItemInputLabel] = useState("");

  const startEditingItem = (item: MarketItem) => {
    setEditingItemId(item.id);
    setEditItemName(item.title);
    setEditItemDesc(item.description);
    setEditItemCost(item.points);
    setEditItemImage(item.image);
    setEditItemRequiresInput(item.requiresInput || false);
    setEditItemIsChest(item.isChest || false);
    setEditItemChestMin(item.chestMin || 1);
    setEditItemChestMax(item.chestMax || 50);
    setEditItemInputLabel(item.inputLabel || "");
    setEditItemStock(item.stock);
    setEditItemCategory(item.category || "");
    setEditItemPinned(!!item.pinned);
    setEditItemHidden(!!item.hidden);
    setEditItemDiscount(item.discountPercentage?.toString() || "");
  };

  const cancelEditingItem = () => {
    setEditingItemId(null);
  };

  const handleSaveEditedItem = async (id: string) => {
    if (!editItemName.trim() || !editItemCost) return;
    setLoading(true);
    try {
      const cats = settings.categories || DEFAULT_CATEGORIES;
      const finalCat = editItemCategory || cats[0];
      
      const discountNumber = Number(editItemDiscount);
      let discountPercentage = null;
      let discountUntil = null;
      if (!isNaN(discountNumber) && discountNumber > 0 && discountNumber < 100) {
        discountPercentage = discountNumber;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        discountUntil = tomorrow;
      }
      
      await updateDoc(doc(db, "marketplace", id), {
        title: editItemName.trim(),
        description: editItemDesc.trim(),
        points: Number(editItemCost),
        stock: Number(editItemStock),
        image: editItemImage,
        category: finalCat,
        pinned: editItemPinned,
        hidden: editItemHidden,
        discountPercentage,
        discountUntil,
        requiresInput: editItemRequiresInput,
        inputLabel: editItemInputLabel,
        isChest: editItemIsChest,
        chestMin: Number(editItemChestMin),
        chestMax: Number(editItemChestMax)
      });
      setEditingItemId(null);
      showAlert("Успешно 🎉", "Товар в магазине успешно обновлен!");
    } catch (err) {
      console.error("Failed to update market item:", err);
      showAlert("Ошибка", "Не удалось обновить товар: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFileSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setEditUploadingImage(true);
    try {
      const compressedBase64 = await compressImageFile(file, 1024, 1024, 0.8);
      if (!compressedBase64) {
        throw new Error("Could not compress image");
      }
      const uploadedUrl = await uploadImageToImgbb(compressedBase64);
      if (uploadedUrl) {
        setEditItemImage(uploadedUrl);
        showAlert("Успешно 🎉", "Изображение успешно загружено на сервер!");
      } else {
        setEditItemImage(compressedBase64); // Fallback to base64
        showAlert("Предупреждение", "Загрузка на сервер не удалась, но изображение сохранено локально!");
      }
    } catch (err) {
      console.error("Failed to compress or upload image:", err);
      showAlert("Ошибка", "Произошла ошибка при обработке и загрузке картинки.");
    } finally {
      setEditUploadingImage(false);
    }
  };

  const palette = TAILWIND_COLOR_PALETTES[primaryColor] || TAILWIND_COLOR_PALETTES.indigo;

  // Compile unified transaction history list (who spent/earned, where, and what was their balance)
  const compiledTransactions = [
    ...chores
      .filter(c => c.status === "approved")
      .map(c => {
        const kid = kids.find(k => k.id === c.assignedTo[0]);
        const dateObj = c.completedAt?.toDate ? c.completedAt.toDate() : new Date(c.completedAt || c.createdAt);
        return {
          id: `tx-chore-${c.id}`,
          date: dateObj,
          kidName: kid?.name || "Ребенок",
          kidAvatar: kid?.avatar || "👦",
          kidBalance: kid?.points || 0,
          type: "income",
          title: c.title,
          points: c.finalPoints || c.points,
          status: "Выполнено"
        };
      }),
    ...purchases.map(p => {
      const kid = kids.find(k => k.id === p.kidId);
      const dateObj = p.issuedAt?.toDate ? p.issuedAt.toDate() : p.createdAt?.toDate ? p.createdAt.toDate() : new Date(p.createdAt);
      return {
        id: `tx-purchase-${p.id}`,
        date: dateObj,
        kidName: p.kidName,
        kidAvatar: kid?.avatar || "👦",
        kidBalance: kid?.points || 0,
        type: "expense",
        title: p.giftedBy ? `${p.productTitle} (Подарок от ${p.giftedBy})` : p.productTitle,
        points: p.points,
        status: p.status === "issued" ? "Вручено" : "Ожидает"
      };
    })
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

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
    if (preset.executionLimitMinutes) {
      setChoreExecutionLimit(preset.executionLimitMinutes);
    } else {
      setChoreExecutionLimit(60);
      setChoreUrgent(false);
          setChoreWeekly(false);
    }
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

        const isUrgent = choreUrgent;
        const finalPoints = isUrgent ? Number(chorePoints) * 2 : Number(chorePoints);
        const finalLimit = isUrgent ? 25 : choreExecutionLimit;

        const newChore: Chore = {
          id: choreId,
          title: choreTitle.trim() + (choreWeekly ? " (Еженедельное)" : ""),
          description: choreDesc.trim(),
          points: finalPoints,
          executionLimitMinutes: finalLimit,
          isUrgent: isUrgent,
          isWeekly: choreWeekly,
          weeklyProgress: [],
          weeklyDaysLogged: 0,
          assignedTo: [kidId],
          status: "pending",
          createdAt: now,
          createdBy: currentUser.id,
          timeoutAt: timeoutAt,
          // executionLimitMinutes already set above
        };

        await setDoc(doc(db, "chores", choreId), newChore);

        // Send Telegram notification
        if (settings.telegramChatId) {
          await sendTelegramNotification(
            `⚡ <b>Новое задание!</b>
Кому: ${kid.name} ${kid.avatar}
Задание: <b>${newChore.title}</b>
Описание: ${newChore.description}
Награда: 🪙 <b>${newChore.points} баллов</b>

<i>Время на принятие: 30 минут! Время на выполнение: ${newChore.executionLimitMinutes || 60} минут!</i>`,
            settings.telegramChatId
          );
        }

        


      // Send direct Telegram notification to Kid
        if (kid.telegramChatId) {
          await sendTelegramNotification(
            `⚡ <b>Новый квест для тебя!</b>
Квест: <b>${newChore.title}</b>
Описание: ${newChore.description}
Награда: 🪙 <b>${newChore.points} монет</b>

<i>Прими его в работу в течение 30 минут! Время на выполнение: ${newChore.executionLimitMinutes || 60} минут! Удачи! 🚀</i>`,
            kid.telegramChatId
          );
        }
      }

      // Reset form
      setChoreTitle("");
      setChoreDesc("");
      setChorePoints(10);
      setChoreExecutionLimit(60);
      setSelectedKids([]);
      setIsCreateChoreModalOpen(false);
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

  const handleResendNotification = async (chore: Chore) => {
    const kidId = chore.assignedTo[0];
    const kid = kids.find(k => k.id === kidId);
    if (!kid) return;

    setLoading(true);
    try {
      // Send Telegram notification again
      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `🔔 <b>Напоминание о задании!</b>
Кому: ${kid.name} ${kid.avatar}
Задание: <b>${chore.title}</b>
Описание: ${chore.description}
Награда: 🪙 <b>${chore.points} баллов</b>

<i>Пожалуйста, не забудь выполнить это задание! 🚀</i>`,
          settings.telegramChatId
        );
      }

      if (kid.telegramChatId) {
        await sendTelegramNotification(
          `🔔 <b>Эй, напоминаю про задание!</b>
Квест: <b>${chore.title}</b>
Награда: 🪙 <b>${chore.points} монет</b>

<i>Жду отчет о выполнении! У тебя всё получится! 💪</i>`,
          kid.telegramChatId
        );
      }
      
      // Update createdAt to bump it up or just a silent update
      await updateDoc(doc(db, "chores", chore.id), {
        lastNotifiedAt: new Date()
      });

      showAlert("Успешно", `Уведомление о задании "${chore.title}" отправлено повторно!`);
    } catch (err) {
      console.error("Failed to resend notification:", err);
      showAlert("Ошибка", "Не удалось отправить уведомление.");
    } finally {
      setLoading(false);
    }
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


      // Log transaction
      const txId = "tx-chore-appr-" + Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "transactions", txId), {
        id: txId,
        kidId: kidId,
        kidName: kid.name,
        type: "income",
        amount: pointsToAward,
        title: `Выполнение квеста: ${chore.title}`,
        createdAt: new Date(),
        balanceAfter: newBalance
      });

      // Check achievements
      try {
        await checkAchievement(kidId, "first_steps", 1, settings);
        await checkAchievement(kidId, "colonist", 1, settings);
        await checkAchievement(kidId, "stalker", 1, settings);
        
        if (chore.createdAt && chore.completedAt) {
          const createTime = chore.createdAt.toDate ? chore.createdAt.toDate().getTime() : new Date(chore.createdAt).getTime();
          const completeTime = chore.completedAt.toDate ? chore.completedAt.toDate().getTime() : new Date(chore.completedAt).getTime();
          if (completeTime - createTime <= 5 * 60 * 1000) {
            await checkAchievement(kidId, "easy_peasy", 1, settings);
          }
        }
      } catch(e) { console.error("Ach err", e); }


      // Send Telegram notification
      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `✅ <b>Задание одобрено!</b>
Ребенок: ${kid.name} ${kid.avatar}
Квест: <b>${chore.title}</b>
Начислено: 🪙 <b>${pointsToAward} баллов</b> (из ${chore.points})
Отзыв: "${feedback}"`,
          settings.telegramChatId
        );
      }

      


      // Send direct Telegram notification to Kid
      if (kid.telegramChatId) {
        await sendTelegramNotification(
          `🎉 <b>Твой квест одобрен родителями!</b>
Квест: <b>${chore.title}</b>
Тебе начислено: 🪙 <b>${pointsToAward} монет!</b>
Отзыв родителя: "${feedback}"

Твой новый баланс: 🪙 <b>${newBalance} монет!</b> Поздравляем! 🥳`,
          kid.telegramChatId
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
          `❌ <b>Задание отклонено!</b>
Ребенок: ${kid.name} ${kid.avatar}
Квест: <b>${chore.title}</b>
Причина: "${feedback}"

<i>Задание возвращено на доработку.</i>`,
          settings.telegramChatId
        );
      }

      


      // Send direct Telegram notification to Kid
      if (kid.telegramChatId) {
        await sendTelegramNotification(
          `⚠️ <b>Твой квест отклонен родителями!</b>
Квест: <b>${chore.title}</b>
Причина: "${feedback}"

<i>Пожалуйста, исправь недочеты и отправь отчет заново! У тебя всё получится! 💪</i>`,
          kid.telegramChatId
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
      const cats = settings.categories || DEFAULT_CATEGORIES;
      const finalCat = itemCategory || cats[0];
      const itemId = "item-" + Math.random().toString(36).substr(2, 9);
      
      const maxSortOrder = marketItems.reduce((max, item) => Math.max(max, item.sortOrder || 0), 0);
      
      const discountNumber = Number(itemDiscount);
      let discountPercentage = null;
      let discountUntil = null;
      if (!isNaN(discountNumber) && discountNumber > 0 && discountNumber < 100) {
        discountPercentage = discountNumber;
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        discountUntil = tomorrow;
      }

      const newItem: MarketItem = {
        id: itemId,
        title: itemName.trim(),
        description: itemDesc.trim(),
        points: Number(itemCost),
        stock: Number(itemStock),
        image: itemImage,
        createdBy: currentUser.id,
        createdAt: new Date(),
        category: finalCat,
        pinned: itemPinned,
        hidden: itemHidden,
        sortOrder: maxSortOrder + 1,
        discountPercentage,
        discountUntil,
        requiresInput: itemRequiresInput,
        inputLabel: itemInputLabel,
        isChest: itemIsChest,
        chestMin: Number(itemChestMin),
        chestMax: Number(itemChestMax)
      };

      await setDoc(doc(db, "marketplace", itemId), newItem);
      
      setItemName("");
      setItemDesc("");
      setItemCost(20);
      setItemStock(5);
      setItemDiscount("");
      setItemImage("🎁");
      setItemCategory("");
      setItemPinned(false);
      setItemHidden(false);
      setItemRequiresInput(false);
      setItemInputLabel("");
      setItemIsChest(false);
      setItemChestMin(1);
      setItemChestMax(50);
      showAlert("Успешно", "Товар успешно добавлен в магазин!");
    } catch (err) {
      console.error("Failed to create market item:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reordering, pinning, hiding helpers
  const handleMoveItemOrder = async (item: MarketItem, direction: "up" | "down") => {
    try {
      const sortedItems = [...marketItems].sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        const oA = a.sortOrder ?? 0;
        const oB = b.sortOrder ?? 0;
        if (oA !== oB) return oA - oB;
        const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return tB - tA;
      });

      const idx = sortedItems.findIndex(i => i.id === item.id);
      if (idx === -1) return;

      const targetIdx = direction === "up" ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= sortedItems.length) return;

      const otherItem = sortedItems[targetIdx];
      
      const orderA = item.sortOrder ?? idx;
      const orderB = otherItem.sortOrder ?? targetIdx;

      await updateDoc(doc(db, "marketplace", item.id), { sortOrder: orderB });
      await updateDoc(doc(db, "marketplace", otherItem.id), { sortOrder: orderA });

    } catch (err) {
      console.error("Failed to swap order:", err);
    }
  };

  const handleTogglePinItem = async (item: MarketItem) => {
    try {
      await updateDoc(doc(db, "marketplace", item.id), { pinned: !item.pinned });
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const handleToggleHideItem = async (item: MarketItem) => {
    try {
      await updateDoc(doc(db, "marketplace", item.id), { hidden: !item.hidden });
    } catch (err) {
      console.error("Failed to toggle hide:", err);
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
          `🎁 <b>Награда выдана ребенку!</b>
Кому: ${purchase.kidName}
Приз: <b>${purchase.productTitle}</b>
Статус: <b>Вручено лично в руки!</b>`,
          settings.telegramChatId
        );
      }

      


      // Send direct Telegram notification to Kid
      const kid = kids.find(k => k.id === purchase.kidId);
      if (kid && kid.telegramChatId) {
        await sendTelegramNotification(
          `🎁 <b>Ура! Твой приз выдан родителями!</b>
Название: <b>${purchase.productTitle}</b>

<i>Родители вручили тебе твой заслуженный приз! Пользуйся с удовольствием! 🥰</i>`,
          kid.telegramChatId
        );
      }
      showAlert("Выдано", "Статус изменен на 'Выдан'. Ребенок будет счастлив!");
    } catch (err) {
      console.error("Failed to update purchase status:", err);
    } finally {
      setLoading(false);
    }
  };

  const activityChartData = useMemo(() => {
    // Generate last 7 days labels (MM/DD)
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      
      const dayData: any = { name: displayDate, date: dateStr };
      kids.forEach(k => {
        dayData[k.name] = 0;
      });
      data.push(dayData);
    }

    // Populate data with approved chores
    chores.forEach(chore => {
      if (chore.status === "approved" && chore.completedAt) {
        const completedDateObj = chore.completedAt.toDate ? chore.completedAt.toDate() : new Date(chore.completedAt);
        const choreDateStr = completedDateObj.toISOString().split('T')[0];
        
        const dayEntry = data.find(d => d.date === choreDateStr);
        if (dayEntry) {
          const kid = kids.find(k => k.id === chore.assignedTo[0]);
          if (kid) {
            dayEntry[kid.name] = (dayEntry[kid.name] || 0) + 1;
          }
        }
      }
    });

    return data;
  }, [chores, kids]);

  return (
    <div className="space-y-6">
      {/* Premium Family Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Treasury */}
        <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white rounded-3xl p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 text-7xl select-none opacity-15 group-hover:scale-110 transition-transform">🪙</div>
          <div>
            <div className="text-[9px] font-black text-amber-100 uppercase tracking-wider">Семейный Банк (Лимит)</div>
            <div className="text-xl md:text-2xl font-black mt-1">🪙 99,999,999.99</div>
            <p className="text-[10px] text-amber-50/80 font-bold mt-1">Общий резерв монет</p>
          </div>
        </div>

        {/* Children Count */}
        <div className="bg-orange-50 border border-orange-100 rounded-3xl p-4 flex items-center justify-between shadow-xs relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 text-7xl select-none opacity-10 group-hover:scale-110 transition-transform">🧸</div>
          <div>
            <div className="text-[9px] font-black text-orange-800 uppercase tracking-wider">Дети в системе</div>
            <div className="text-2xl font-black text-orange-700 mt-1">{kids.length} чел.</div>
            <p className="text-[10px] text-orange-500 font-bold mt-1">Вход настроен</p>
          </div>
        </div>

        {/* Quests Review */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-4 flex items-center justify-between shadow-xs relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 text-7xl select-none opacity-10 group-hover:scale-110 transition-transform">⌛</div>
          <div>
            <div className="text-[9px] font-black text-indigo-800 uppercase tracking-wider font-sans">Ждут проверки</div>
            <div className="text-2xl font-black text-indigo-700 mt-1">
              {chores.filter(c => c.status === "completed").length} кв.
            </div>
            <p className="text-[10px] text-indigo-500 font-bold mt-1">Требуют оценки</p>
          </div>
        </div>

        {/* Total Purchases count */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-4 flex items-center justify-between shadow-xs relative overflow-hidden group">
          <div className="absolute -bottom-6 -right-6 text-7xl select-none opacity-10 group-hover:scale-110 transition-transform">🎁</div>
          <div>
            <div className="text-[9px] font-black text-emerald-800 uppercase tracking-wider">Заказы наград</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {purchases.filter(p => p.status === "pending").length} шт.
            </div>
            <p className="text-[10px] text-emerald-500 font-bold mt-1">Ожидают выдачи</p>
          </div>
        </div>
      </div>

      {/* Activity Graph */}
      {kids.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm">Активность детей (выполнено заданий за 7 дней)</h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '4px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                {kids.map((kid, index) => {
                  const colors = ['#818cf8', '#fbbf24', '#34d399', '#f472b6', '#38bdf8'];
                  return (
                    <Bar key={kid.id} dataKey={kid.name} fill={colors[index % colors.length]} radius={[4, 4, 0, 0]} />
                  );
                })}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
      
      {view === "kids" && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-6">
              <Users className="w-6 h-6 text-indigo-500" />
              Управление детьми и достижениями
            </h2>
            <div className="space-y-6">
              {kids.map(kid => (
                <div key={kid.id} className="p-4 bg-slate-50 border border-slate-200 rounded-3xl">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl bg-white p-2 rounded-xl border border-slate-100">{kid.avatar}</div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{kid.name}</h3>
                        <p className="text-xs text-slate-500 font-bold">Баланс: {kid.points} 🪙</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Достижения</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ACHIEVEMENTS.map(ach => {
                        const userAch = (kid.achievements || {})[ach.id];
                        const isCompleted = userAch?.completed || false;
                        return (
                          <div key={ach.id} className={`p-3 rounded-2xl border flex items-center gap-3 ${isCompleted ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
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
                                className={`mt-1 text-[9px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${isCompleted ? 'bg-amber-200 text-amber-800 hover:bg-amber-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                              >
                                {isCompleted ? "Снять" : "Выдать"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {view === "chores" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* New Chore creator */}
          <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-slate-100 shadow-sm col-span-1 xl:col-span-3">
             <div>
               <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                 <Award className="w-4.5 h-4.5 text-indigo-500" />
                 Все выданные задания
               </h3>
             </div>
             <button
               onClick={() => setIsCreateChoreModalOpen(true)}
               className={`px-4 py-3 ${palette.bg} ${palette.hover} text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2`}
             >
               <Plus className="w-4 h-4" /> Добавить задание
             </button>
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
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Активные и Отмененные задания ({chores.filter(c => c.status === "accepted" || c.status === "pending" || c.status === "rejected" || c.status === "declined").length})</h4>
              {chores.filter(c => c.status === "accepted" || c.status === "pending" || c.status === "rejected" || c.status === "declined").length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-medium">
                  Нет активных заданий. Поручите новое!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {chores.filter(c => c.status === "accepted" || c.status === "pending" || c.status === "rejected" || c.status === "declined").map((chore) => {
                    const kid = kids.find(k => k.id === chore.assignedTo[0]);
                    return (
                      <div 
                        key={chore.id}
                        className={`p-4 border bg-white rounded-2xl flex flex-col justify-between gap-3 shadow-sm relative group ${chore.isUrgent ? "border-rose-400 shadow-rose-100" : "border-slate-200"}`}
                      >
                        <div className="absolute top-2.5 right-2.5 flex gap-2">
                          <button
                            onClick={() => handleResendNotification(chore)}
                            className="p-2 bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 rounded-full shadow-md hover:scale-105 transition-all cursor-pointer z-10 flex items-center justify-center"
                            title="Повторить уведомление"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteChore(chore.id, chore.title)}
                            className="p-2 bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 rounded-full shadow-md hover:scale-105 transition-all cursor-pointer z-10 flex items-center justify-center"
                            title="Удалить задание"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl">{kid?.avatar || "👦"}</span>
                            <span className="text-[10px] font-extrabold text-slate-400 uppercase">{kid?.name}</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase ml-auto ${
                              chore.status === "pending" ? "bg-amber-100 text-amber-700" : chore.status === "rejected" ? "bg-red-100 text-red-600" : chore.status === "declined" ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {chore.status === "pending" ? "Ожидает" : chore.status === "rejected" ? "Доработка" : chore.status === "declined" ? "Отказ" : "Выполняется"}
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
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {chore.status === "pending" ? "На принятие: 30 мин" : `На выполнение: ${chore.executionLimitMinutes || 60} мин`}
                            </span>
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
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Категория товара</label>
                <select
                  value={itemCategory}
                  onChange={(e) => setItemCategory(e.target.value)}
                  className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="">-- Выберите категорию --</option>
                  {(settings.categories || DEFAULT_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
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

              
              <div className="flex items-center gap-2 mt-2 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                <input
                  type="checkbox"
                  id="requiresInput"
                  checked={itemRequiresInput}
                  onChange={(e) => setItemRequiresInput(e.target.checked)}
                  className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-500"
                />
                <label htmlFor="requiresInput" className="text-xs font-bold text-indigo-600 uppercase cursor-pointer select-none">
                  Требовать ввод данных при покупке (например, номер карты)
                </label>
              </div>
              {itemRequiresInput && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Текст над полем ввода</label>
                  <input
                    type="text"
                    required
                    placeholder="Введите номер карты"
                    value={itemInputLabel}
                    onChange={(e) => setItemInputLabel(e.target.value)}
                    className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase text-rose-500">Скидка по акции % (1-99)</label>
                <input
                  type="number"
                  min={0}
                  max={99}
                  value={itemDiscount}
                  onChange={(e) => setItemDiscount(e.target.value)}
                  placeholder="Например: 10 (пусто - без скидки)"
                  className="w-full mt-1 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-rose-300"
                />
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
                    <label className="w-full py-2 bg-slate-50 border border-dashed border-slate-300 hover:border-indigo-400 text-slate-500 hover:text-indigo-600 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer">
                      📁 Загрузить свою картинку (с устройства)
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileSelectImage}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Или вставьте прямую ссылку на картинку"
                  value={itemImage.startsWith("http") ? itemImage : ""}
                  onChange={(e) => setItemImage(e.target.value || "🎁")}
                  className="w-full mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                />
              </div>

              <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 mt-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={itemPinned}
                    onChange={(e) => setItemPinned(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>📌 Закрепить сверху</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={itemHidden}
                    onChange={(e) => setItemHidden(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span>👁️‍🗨️ Скрыть товар</span>
                </label>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Товары на витрине ({marketItems.length})</h4>
              
              {/* Category selector filter */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase whitespace-nowrap">Категория:</span>
                <select
                  value={parentMarketCategoryFilter}
                  onChange={(e) => setParentMarketCategoryFilter(e.target.value)}
                  className="p-1 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-2xs"
                >
                  <option value="">Все категории</option>
                  {(settings.categories || DEFAULT_CATEGORIES).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {(() => {
              const sortedFilteredItems = marketItems
                .filter(item => parentMarketCategoryFilter === "" || item.category === parentMarketCategoryFilter)
                .sort((a, b) => {
                  if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                  const oA = a.sortOrder ?? 0;
                  const oB = b.sortOrder ?? 0;
                  if (oA !== oB) return oA - oB;
                  const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
                  const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
                  return tB - tA;
                });

              return sortedFilteredItems.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-xs text-slate-400 font-medium">
                  Нет товаров, соответствующих выбранным критериям.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sortedFilteredItems.map((item, index) => {
                    if (editingItemId === item.id) {
                      return (
                        <div 
                          key={item.id}
                          className="p-4 border-2 border-indigo-500 bg-indigo-50/20 rounded-2xl space-y-3 shadow-md relative"
                        >
                          <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase">Редактирование товара</span>
                            <button
                              type="button"
                              onClick={cancelEditingItem}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                              title="Отмена"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">Название</label>
                              <input
                                type="text"
                                value={editItemName}
                                onChange={(e) => setEditItemName(e.target.value)}
                                className="w-full mt-0.5 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">Категория</label>
                              <select
                                value={editItemCategory}
                                onChange={(e) => setEditItemCategory(e.target.value)}
                                className="w-full mt-0.5 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                <option value="">-- Выберите категорию --</option>
                                {(settings.categories || DEFAULT_CATEGORIES).map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">Описание</label>
                              <textarea
                                value={editItemDesc}
                                onChange={(e) => setEditItemDesc(e.target.value)}
                                className="w-full mt-0.5 p-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                rows={2}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase">Стоимость (🪙)</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={editItemCost}
                                  onChange={(e) => setEditItemCost(Number(e.target.value))}
                                  className="w-full mt-0.5 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-amber-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-slate-400 uppercase">Количество (шт)</label>
                                <input
                                  type="number"
                                  min={0}
                                  value={editItemStock}
                                  onChange={(e) => setEditItemStock(Number(e.target.value))}
                                  className="w-full mt-0.5 p-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  title="0 для бесконечного количества"
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase text-rose-500">Скидка по акции % (1-99)</label>
                              <input
                                type="number"
                                min={0}
                                max={99}
                                value={editItemDiscount}
                                onChange={(e) => setEditItemDiscount(e.target.value)}
                                placeholder="Например: 10 (пусто - без скидки)"
                                className="w-full mt-0.5 p-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-500 placeholder-rose-300"
                              />
                            </div>

                            <div>
                              <label className="block text-[9px] font-bold text-slate-400 uppercase">Изображение / Иконка</label>
                              <div className="flex gap-2 items-center mt-1">
                                <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xl shrink-0 overflow-hidden">
                                  {editItemImage.startsWith("http") ? (
                                    <img src={editItemImage} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    editItemImage
                                  )}
                                </div>
                                <div className="flex-grow flex gap-1 flex-wrap">
                                  {["🎁", "🖥️", "🍕", "🎮", "🍭", "🧸"].map((em) => (
                                    <button
                                      key={em}
                                      type="button"
                                      onClick={() => setEditItemImage(em)}
                                      className={`text-base p-1 rounded hover:bg-slate-100 cursor-pointer ${
                                        editItemImage === em ? "bg-indigo-100 border border-indigo-200" : ""
                                      }`}
                                    >
                                      {em}
                                    </button>
                                  ))}
                                  <label className="text-[9px] font-black text-indigo-600 hover:underline px-1.5 py-1 bg-indigo-50 rounded cursor-pointer flex items-center justify-center">
                                    {editUploadingImage ? "Загрузка..." : "Своё фото"}
                                    <input
                                      type="file"
                                      ref={editFileInputRef}
                                      accept="image/*"
                                      onChange={handleEditFileSelectImage}
                                      className="hidden"
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-4 p-2 bg-slate-50 rounded-xl border border-slate-200">
                              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={editItemPinned}
                                  onChange={(e) => setEditItemPinned(e.target.checked)}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span>📌 Закрепить</span>
                              </label>

                              <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  checked={editItemHidden}
                                  onChange={(e) => setEditItemHidden(e.target.checked)}
                                  className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                                />
                                <span>👁️ Скрыть</span>
                              </label>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <button
                                type="button"
                                onClick={cancelEditingItem}
                                className="flex-1 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer text-center"
                              >
                                Отмена
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveEditedItem(item.id)}
                                disabled={loading}
                                className={`flex-1 py-1.5 px-3 ${palette.bg} ${palette.hover} text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer text-center`}
                              >
                                {loading ? "Сохранение..." : "Сохранить"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div 
                        key={item.id}
                        className="p-4 border border-slate-200 bg-white rounded-2xl flex flex-col justify-between gap-3 shadow-sm relative group overflow-hidden"
                      >
                        {/* Display badges */}
                        <div className="flex flex-wrap gap-1 mb-1">
                          {item.pinned && (
                            <span className="bg-amber-100 text-amber-800 font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md border border-amber-200 shadow-3xs uppercase">
                              📌 ЗАКРЕПЛЕН
                            </span>
                          )}
                          {item.hidden && (
                            <span className="bg-rose-100 text-rose-800 font-black text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md border border-rose-200 uppercase">
                              👁️ СКРЫТ
                            </span>
                          )}
                          {item.category && (
                            <span className="bg-slate-100 text-slate-600 font-bold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md border border-slate-200">
                              {item.category}
                            </span>
                          )}
                        </div>

                        {/* Control buttons */}
                        <div className="absolute top-2 right-2 flex gap-1 z-10 opacity-70 group-hover:opacity-100 transition-opacity">
                          {/* Order Up */}
                          <button
                            type="button"
                            onClick={() => handleMoveItemOrder(item, "up")}
                            disabled={index === 0}
                            className={`p-1.5 rounded-full shadow-xs transition-all flex items-center justify-center ${
                              index === 0 
                                ? "bg-slate-100 text-slate-300 cursor-not-allowed" 
                                : "bg-slate-900 text-white hover:bg-slate-700 hover:scale-105 cursor-pointer"
                            }`}
                            title="Переместить выше"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>

                          {/* Order Down */}
                          <button
                            type="button"
                            onClick={() => handleMoveItemOrder(item, "down")}
                            disabled={index === sortedFilteredItems.length - 1}
                            className={`p-1.5 rounded-full shadow-xs transition-all flex items-center justify-center ${
                              index === sortedFilteredItems.length - 1 
                                ? "bg-slate-100 text-slate-300 cursor-not-allowed" 
                                : "bg-slate-900 text-white hover:bg-slate-700 hover:scale-105 cursor-pointer"
                            }`}
                            title="Переместить ниже"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>

                          <button
                            type="button"
                            onClick={() => startEditingItem(item)}
                            className="p-1.5 bg-slate-950 text-white hover:bg-slate-800 active:bg-black rounded-full shadow-xs hover:scale-105 transition-all cursor-pointer flex items-center justify-center"
                            title="Редактировать товар"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMarketItem(item.id, item.title)}
                            className="p-1.5 bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 rounded-full shadow-xs hover:scale-105 transition-all cursor-pointer flex items-center justify-center"
                            title="Удалить товар"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex gap-3 w-full pt-1">
                          <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl shrink-0 overflow-hidden relative">
                            {item.image.startsWith("http") ? (
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              item.image
                            )}
                            {item.discountPercentage && item.discountUntil && (new Date(item.discountUntil?.toDate ? item.discountUntil.toDate() : item.discountUntil).getTime() > Date.now()) && (
                              <div className="absolute top-1 right-1 bg-rose-500 text-white font-black text-[8px] px-1 py-0.5 rounded shadow-sm border border-rose-400 leading-none">
                                -{item.discountPercentage}%
                              </div>
                            )}
                          </div>

                          <div className="space-y-0.5 truncate flex-grow">
                            <h5 className="font-extrabold text-slate-800 text-xs sm:text-sm truncate pr-16">{item.title}</h5>
                            <p className="text-slate-400 text-[10px] sm:text-xs line-clamp-2 leading-relaxed">{item.description}</p>
                            <div className="pt-1 flex items-center gap-2">
                              <span className="text-[10px] sm:text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                🪙 {item.points} монет
                              </span>
                              <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold">
                                Остаток: {item.stock === 0 ? "♾️ безлимит" : `${item.stock} шт`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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
                          {pur.giftedBy ? (
                            <span>Подарок для {pur.kidName} (от {pur.giftedBy})</span>
                          ) : (
                            <span>Купил: {pur.kidName}</span>
                          )}
                        </div>
                        <h5 className="font-bold text-slate-800 text-sm mt-0.5 truncate pr-8">{pur.productTitle}</h5>
                        <div className="text-[10px] text-slate-400 font-medium">
                          Списано: <span className="font-bold text-amber-600">🪙 {pur.points} баллов</span>
                        </div>
                        {pur.customInput && (
                          <div className="mt-1.5 p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                            <span className="block text-[8px] font-black text-indigo-400 uppercase">Введенные данные:</span>
                            <span className="text-xs font-semibold text-slate-700">{pur.customInput}</span>
                          </div>
                        )}
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

          {/* Unified Transaction History Ledger */}
          <div className="pt-6 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">История транзакций и баланса</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Учет всех начислений и списаний монет в вашей семье</p>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-full border border-slate-200">
                Всего операций: {compiledTransactions.length}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-3xl overflow-hidden">
              {compiledTransactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-medium">Транзакций пока не зарегистрировано.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                        <th className="p-3.5 pl-5">Ребенок</th>
                        <th className="p-3.5">Операция</th>
                        <th className="p-3.5">Сумма</th>
                        <th className="p-3.5">Баланс ребенка</th>
                        <th className="p-3.5">Дата</th>
                        <th className="p-3.5 pr-5 text-right">Статус</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {compiledTransactions.slice(0, 15).map((tx) => (
                        <tr key={tx.id} className="hover:bg-white/80 transition-colors bg-white">
                          <td className="p-3.5 pl-5 font-bold text-slate-800 flex items-center gap-2">
                            <span className="text-lg bg-slate-50 p-1.5 rounded-lg border border-slate-100">{tx.kidAvatar}</span>
                            <span>{tx.kidName}</span>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold text-slate-700">{tx.title || 'Транзакция'}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5">
                              {tx.type === "income" ? "🏆 За выполненный квест" : "🎁 Заказан приз в магазине"}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className={`font-extrabold px-2 py-0.5 rounded-md border text-[11px] ${
                              tx.type === "income"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                : "bg-rose-50 text-rose-700 border-rose-100"
                            }`}>
                              {tx.type === "income" ? "+" : "-"}{tx.points} 🪙
                            </span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-600">
                            🪙 {tx.kidBalance}
                          </td>
                          <td className="p-3.5 text-slate-400 font-medium text-[10px]">
                            {tx.date.toLocaleDateString("ru-RU")} {tx.date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                          </td>
                          <td className="p-3.5 pr-5 text-right">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                              tx.status === "Выполнено" || tx.status === "Вручено"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Chore Modal */}
      <AnimatePresence>
        {isCreateChoreModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                  Раздать новое задание
                </h3>
                <button
                   onClick={() => setIsCreateChoreModalOpen(false)}
                   className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg text-xs font-bold"
                >
                  Закрыть
                </button>
              </div>
              <div className="p-5 overflow-y-auto">
                <div className="space-y-4">
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
                          {preset.title}
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
                        <label className="block text-[10px] font-bold text-slate-400 uppercase flex justify-between">
                          <span>Цена (баллы 🪙)</span>
                          {choreUrgent && <span className="text-rose-500 font-black flex gap-1 items-center">🔥 Будет: {chorePoints * 2}</span>}
                        </label>
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
                      <label className="block text-[10px] font-bold text-slate-400 uppercase">Время на выполнение (минут)</label>
                      <input
                        type="number"
                        min={1}
                        value={choreUrgent ? 25 : choreExecutionLimit}
                        disabled={choreUrgent}
                        onChange={(e) => setChoreExecutionLimit(Number(e.target.value))}
                        className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 bg-rose-50 p-2 rounded-xl border border-rose-100">
                        <input
                          type="checkbox"
                          id="urgent"
                          checked={choreUrgent}
                          onChange={(e) => setChoreUrgent(e.target.checked)}
                          className="w-4 h-4 text-rose-500 rounded focus:ring-rose-500 cursor-pointer accent-rose-500"
                        />
                        <label htmlFor="urgent" className="text-[10px] font-black text-rose-600 uppercase cursor-pointer select-none">
                          ⚡ Срочное
                        </label>
                      </div>

                      <div className="flex items-center gap-2 bg-indigo-50 p-2 rounded-xl border border-indigo-100">
                        <input
                          type="checkbox"
                          id="weekly"
                          checked={choreWeekly}
                          onChange={(e) => setChoreWeekly(e.target.checked)}
                          className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500 cursor-pointer accent-indigo-500"
                        />
                        <label htmlFor="weekly" className="text-[10px] font-black text-indigo-600 uppercase cursor-pointer select-none">
                          📅 Еженедельное
                        </label>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase">Кому поручить задание?</label>
                        {kids.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedKids.length === kids.length) {
                                setSelectedKids([]);
                              } else {
                                setSelectedKids(kids.map(k => k.id));
                              }
                            }}
                            className={`text-[9px] font-bold uppercase transition-colors cursor-pointer ${
                              selectedKids.length === kids.length ? "text-rose-500 hover:text-rose-600" : "text-indigo-500 hover:text-indigo-600"
                            }`}
                          >
                            {selectedKids.length === kids.length ? "Снять выбор" : "Выбрать всех"}
                          </button>
                        )}
                      </div>
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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

                {(reviewChore.proofPhoto || (reviewChore.weeklyPhotos && reviewChore.weeklyPhotos.length > 0)) && (
                  <div className="w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner space-y-2 max-h-[300px] overflow-y-auto p-2">
                    {reviewChore.isWeekly && reviewChore.weeklyPhotos ? (
                      reviewChore.weeklyPhotos.map((url, idx) => (
                        <div key={idx} className="relative mb-2 last:mb-0">
                            <div className="absolute top-2 left-2 bg-indigo-500 text-white text-[9px] font-black px-2 py-1 rounded-lg z-10 shadow-sm uppercase">День {idx + 1}</div>
                            <img 
                              src={url} 
                              alt={`Proof Day ${idx+1}`} 
                              className="w-full rounded-xl object-contain border border-slate-200 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                        </div>
                      ))
                    ) : (
                      reviewChore.proofPhoto && reviewChore.proofPhoto.split(',').map((url, idx) => (
                        <div key={idx} className="relative">
                            <img 
                              src={url} 
                              alt={`Proof ${idx+1}`} 
                              className="w-full rounded-xl object-contain"
                              referrerPolicy="no-referrer"
                            />
                        </div>
                      ))
                    )}
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
