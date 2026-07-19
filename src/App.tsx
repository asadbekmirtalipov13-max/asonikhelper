import React, { useState, useEffect } from "react";
import { 
  collection, doc, onSnapshot, setDoc, getDoc, updateDoc, query, orderBy 
} from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { FamilyUser, Chore, MarketItem, Purchase, SiteSettings } from "./types";
import { TAILWIND_COLOR_PALETTES } from "./presets";
import LoginScreen from "./components/LoginScreen";
import ParentDashboard from "./components/ParentDashboard";
import KidDashboard from "./components/KidDashboard";
import AdminPanel from "./components/AdminPanel";
import { 
  LogOut, Shield, Award, ShoppingBag, Settings, Star, Flame, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Active auth user state
  const [currentUser, setCurrentUser] = useState<FamilyUser | null>(null);

  // Firestore collections states
  const [users, setUsers] = useState<FamilyUser[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);
  const [marketItems, setMarketItems] = useState<MarketItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [settings, setSettings] = useState<SiteSettings>({
    title: "Семейный Маркетплейс и Квесты",
    logo: "🏪",
    primaryColor: "indigo",
    telegramChatId: ""
  });

  // Admin routing state: parents can toggle between dashboard and settings
  const [currentView, setCurrentView] = useState<"dashboard" | "admin">("dashboard");
  const [dbLoading, setDbLoading] = useState(true);

  const palette = TAILWIND_COLOR_PALETTES[settings.primaryColor] || TAILWIND_COLOR_PALETTES.indigo;

  // 1. Setup real-time Firestore listeners
  useEffect(() => {
    setDbLoading(true);

    // Listener for Global Settings document
    const unsubSettings = onSnapshot(doc(db, "settings", "global"), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SiteSettings);
      } else {
        // Create default settings if not exists
        const defaultSettings: SiteSettings = {
          title: "HELPER",
          logo: "🤝",
          primaryColor: "indigo",
          telegramChatId: ""
        };
        setDoc(doc(db, "settings", "global"), defaultSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/global");
    });

    // Listener for Users
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const usersList: FamilyUser[] = [];
      snapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as FamilyUser);
      });
      setUsers(usersList);
      setDbLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "users");
    });

    // Listener for Chores ordered by creation time
    const unsubChores = onSnapshot(collection(db, "chores"), (snapshot) => {
      const choresList: Chore[] = [];
      snapshot.forEach((doc) => {
        choresList.push({ id: doc.id, ...doc.data() } as Chore);
      });
      // Sort manually to avoid setting up composite indexes in firestore
      choresList.sort((a, b) => {
        const timeA = a.createdAt?.seconds || a.createdAt?.getTime?.() || 0;
        const timeB = b.createdAt?.seconds || b.createdAt?.getTime?.() || 0;
        return timeB - timeA; // Descending order
      });
      setChores(choresList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "chores");
    });

    // Listener for Marketplace
    const unsubMarket = onSnapshot(collection(db, "marketplace"), (snapshot) => {
      const items: MarketItem[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as MarketItem);
      });
      setMarketItems(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "marketplace");
    });

    // Listener for Purchases
    const unsubPurchases = onSnapshot(collection(db, "purchases"), (snapshot) => {
      const purchaseList: Purchase[] = [];
      snapshot.forEach((doc) => {
        purchaseList.push({ id: doc.id, ...doc.data() } as Purchase);
      });
      // Sort descending by creation date
      purchaseList.sort((a, b) => {
        const timeA = a.createdAt?.seconds || a.createdAt?.getTime?.() || 0;
        const timeB = b.createdAt?.seconds || b.createdAt?.getTime?.() || 0;
        return timeB - timeA;
      });
      setPurchases(purchaseList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "purchases");
    });

    return () => {
      unsubSettings();
      unsubUsers();
      unsubChores();
      unsubMarket();
      unsubPurchases();
    };
  }, []);

  // 2. Local Storage Auth session loader
  useEffect(() => {
    const savedUser = localStorage.getItem("family_user_session");
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } catch (e) {
        console.error("Failed to parse saved user session:", e);
      }
    }
  }, []);

  // Sync state changes back to currentUser when database details are updated
  useEffect(() => {
    if (currentUser) {
      const updatedUser = users.find(u => u.id === currentUser.id);
      if (updatedUser) {
        // Keep role, avatar, and points perfectly in sync with Firestore!
        setCurrentUser(prev => {
          if (!prev) return null;
          return {
            ...prev,
            points: updatedUser.points,
            dailyStreak: updatedUser.dailyStreak,
            lastCheckIn: updatedUser.lastCheckIn,
            avatar: updatedUser.avatar,
            name: updatedUser.name
          };
        });
      }
    }
  }, [users]);

  // Handle Login event
  const handleLogin = async (userPayload: any) => {
    // 1. Check if user already exists in DB by email first (for Google login of pre-created users)
    const emailLower = userPayload.email?.toLowerCase();
    const matchedByEmail = users.find(u => u.email && u.email.toLowerCase() === emailLower);

    let finalUser: FamilyUser;

    if (matchedByEmail) {
      // Use existing profile so their data, points, and role are preserved
      finalUser = matchedByEmail;
    } else {
      const userRef = doc(db, "users", userPayload.id);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        finalUser = { id: userPayload.id, ...userSnap.data() } as FamilyUser;
      } else {
        // Create record for new Google auth parent
        finalUser = {
          id: userPayload.id,
          email: userPayload.email,
          name: userPayload.name,
          role: userPayload.role, // 'admin' or 'parent' as resolved in LoginScreen
          avatar: userPayload.avatar || "👩",
          points: 0,
          createdAt: new Date(),
          dailyStreak: 0
        };
        await setDoc(userRef, finalUser);
      }
    }

    setCurrentUser(finalUser);
    localStorage.setItem("family_user_session", JSON.stringify(finalUser));
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("family_user_session");
  };

  // Custom high-contrast modal state for alert/confirm (replaces blocked native iframe window dialogs)
  const [customModal, setCustomModal] = useState<{
    isOpen: boolean;
    type: "alert" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);

  const showAlert = (title: string, message: string) => {
    setCustomModal({
      isOpen: true,
      type: "alert",
      title,
      message
    });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomModal({
      isOpen: true,
      type: "confirm",
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setCustomModal(null);
      }
    });
  };

  const handleUpdateGlobalSettings = async (newSettings: Partial<SiteSettings>) => {
    try {
      await updateDoc(doc(db, "settings", "global"), newSettings);
    } catch (err) {
      console.error("Failed to update global settings:", err);
    }
  };

  if (dbLoading && !currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7FE]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-3xl animate-bounce">
            🏪
          </div>
          <div className="text-sm font-bold text-slate-600 animate-pulse">Загрузка семейной базы данных...</div>
        </div>
      </div>
    );
  }

  // Render Login screen if not signed in
  if (!currentUser) {
    const kids = users.filter(u => u.role === "kid");
    const parents = users.filter(u => u.role === "parent" || u.role === "admin");
    return (
      <LoginScreen 
        onLogin={handleLogin} 
        kids={kids} 
        parents={parents}
        primaryColor={settings.primaryColor}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex flex-col">
      {/* Top Premium Header */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <span className="text-3xl select-none filter drop-shadow-sm">{settings.logo || "🤝"}</span>
            <div>
              <h1 className="font-black text-slate-800 text-base sm:text-lg tracking-tight leading-none">
                {settings.title && settings.title !== "Семейный Маркетплейс и Квесты" ? settings.title : "HELPER"}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase mt-0.5">powered by ASONIK</p>
            </div>
          </div>

          {/* Navigation Control & User Profile */}
          <div className="flex items-center gap-3">
            {/* If Admin/Parent - show Dashboard/Admin toggle */}
            {(currentUser.role === "admin" || currentUser.role === "parent") && (
              <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                <button
                  onClick={() => setCurrentView("dashboard")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    currentView === "dashboard"
                      ? `${palette.bg} text-white shadow-xs`
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Award className="w-3.5 h-3.5" />
                  Панель
                </button>
                <button
                  onClick={() => setCurrentView("admin")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    currentView === "admin"
                      ? `${palette.bg} text-white shadow-xs`
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                  Настройки
                </button>
              </div>
            )}

            {/* Active User badge */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 p-1.5 pr-3 rounded-full shadow-inner">
              <span className="text-2xl bg-white p-1 rounded-full border border-slate-100 shadow-xs h-9 w-9 flex items-center justify-center">
                {currentUser.avatar}
              </span>
              <div className="text-left max-w-[120px]">
                <div className="font-bold text-xs text-slate-800 truncate leading-tight">{currentUser.name}</div>
                <div className="text-[9px] text-slate-400 capitalize font-bold">
                  {currentUser.role === "admin" ? "Администратор" : 
                   currentUser.role === "parent" ? "Родитель" : `Ребенок • 🪙 ${currentUser.points}`}
                </div>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-transparent hover:border-rose-100 cursor-pointer"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Small screen role-switch rail */}
        {(currentUser.role === "admin" || currentUser.role === "parent") && (
          <div className="sm:hidden flex border-t border-slate-100 bg-slate-50/60 p-1">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                currentView === "dashboard" ? `${palette.text} font-black` : "text-slate-400"
              }`}
            >
              <Award className="w-4 h-4" /> Панель
            </button>
            <button
              onClick={() => setCurrentView("admin")}
              className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer ${
                currentView === "admin" ? `${palette.text} font-black` : "text-slate-400"
              }`}
            >
              <Settings className="w-4 h-4" /> Настройки
            </button>
          </div>
        )}
      </header>

      {/* Main Content Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + "-" + currentUser.role}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
          >
            {currentUser.role === "kid" ? (
              <KidDashboard
                currentUser={currentUser}
                chores={chores}
                marketItems={marketItems}
                purchases={purchases}
                settings={settings}
                primaryColor={settings.primaryColor}
                showAlert={showAlert}
                showConfirm={showConfirm}
              />
            ) : currentView === "admin" ? (
              <AdminPanel
                currentUser={currentUser}
                users={users}
                settings={settings}
                onUpdateSettings={handleUpdateGlobalSettings}
                primaryColor={settings.primaryColor}
                showAlert={showAlert}
                showConfirm={showConfirm}
              />
            ) : (
              <ParentDashboard
                currentUser={currentUser}
                kids={users.filter(u => u.role === "kid")}
                chores={chores}
                marketItems={marketItems}
                purchases={purchases}
                settings={settings}
                primaryColor={settings.primaryColor}
                showAlert={showAlert}
                showConfirm={showConfirm}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Small beautiful human credit line footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-1">
        <div>HELPER • С любовью для братьев ❤️</div>
        <div className="text-[10px] text-slate-300 font-black tracking-wider uppercase">powered by ASONIK</div>
      </footer>

      {/* Custom Alert/Confirm Modal Overlay */}
      <AnimatePresence>
        {customModal && customModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (customModal.type === "alert") {
                  setCustomModal(null);
                }
              }}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-xs"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white border border-slate-100 shadow-2xl rounded-3xl max-w-sm w-full p-6 overflow-hidden z-10"
            >
              {/* Header Icon */}
              <div className="flex items-start gap-3.5">
                <div className={`p-3 rounded-2xl shrink-0 ${
                  customModal.type === "confirm" ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
                }`}>
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1 text-left">
                  <h3 className="text-sm font-black text-slate-800 tracking-tight leading-tight uppercase">
                    {customModal.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold leading-relaxed whitespace-pre-wrap">
                    {customModal.message}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-slate-100">
                {customModal.type === "confirm" && (
                  <button
                    type="button"
                    onClick={() => setCustomModal(null)}
                    className="px-4 py-2 text-xs font-black text-slate-500 hover:text-slate-800 hover:bg-slate-50 border border-slate-200/50 rounded-xl transition-all cursor-pointer"
                  >
                    Отмена
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (customModal.type === "confirm" && customModal.onConfirm) {
                      customModal.onConfirm();
                    }
                    setCustomModal(null);
                  }}
                  className={`px-5 py-2 text-xs font-black text-white rounded-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${
                    customModal.type === "confirm" ? "bg-rose-500 hover:bg-rose-600" : `${palette.bg} ${palette.hover}`
                  }`}
                >
                  {customModal.type === "confirm" ? "Да, удалить" : "Хорошо"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
