import React, { useState } from "react";
import { auth, googleProvider, signInWithPopup } from "../firebase";
import { FamilyUser, SiteSettings } from "../types";
import { Shield, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { TAILWIND_COLOR_PALETTES } from "../presets";

interface LoginScreenProps {
  onLogin: (user: FamilyUser | { id: string; email: string; name: string; role: "admin" | "parent" | "kid"; avatar: string; points: number }) => void;
  kids: FamilyUser[];
  parents: FamilyUser[];
  primaryColor: keyof typeof TAILWIND_COLOR_PALETTES;
  settings?: SiteSettings;
}

export default function LoginScreen({ onLogin, kids, parents, primaryColor, settings }: LoginScreenProps) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const palette = TAILWIND_COLOR_PALETTES[primaryColor] || TAILWIND_COLOR_PALETTES.indigo;

  // Real Firebase Auth with Google
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        const email = result.user.email || "";
        const name = result.user.displayName || "Пользователь";
        // Check if this is the admin email
        const isAdmin = email.toLowerCase() === "asadbekmirtalipov13@gmail.com";
        
        onLogin({
          id: result.user.uid,
          email: email,
          name: name,
          role: isAdmin ? "admin" : "parent", // Default to parent if not admin (App.tsx will automatically resolve and preserve the correct role if the email is pre-registered)
          avatar: "⭐",
          points: 0,
          createdAt: new Date(),
          dailyStreak: 0
        });
      }
    } catch (err: any) {
      console.error("Google Login failed:", err);
      setError(
        "Не удалось открыть окно входа Google. Если вы находитесь в окне предпросмотра, пожалуйста, нажмите кнопку открытия приложения в отдельной вкладке в правом верхнем углу экрана."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F4F7FE] relative overflow-hidden">
      {/* Decorative gradient backgrounds */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-200/50 blur-3xl opacity-40"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-amber-200/50 blur-3xl opacity-40"></div>

      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden relative z-10"
      >
        {/* Card Header */}
        <div className="p-8 text-center border-b border-slate-200 relative">
          <div className="absolute top-4 right-4">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <motion.div 
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="inline-flex p-3 rounded-2xl bg-indigo-50 text-indigo-600 text-4xl mb-3 shadow-inner w-16 h-16 items-center justify-center overflow-hidden shrink-0"
          >
            {settings?.logo && (settings.logo.startsWith("http") || settings.logo.startsWith("data:")) ? (
              <img 
                src={settings.logo} 
                alt="Logo" 
                className="w-12 h-12 object-contain"
                referrerPolicy="no-referrer"
              />
            ) : (
              settings?.logo || "🏪"
            )}
          </motion.div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            {settings?.title && settings.title !== "Семейный Маркетплейс и Квесты" ? settings.title : "HELPER"}
          </h1>
          <p className="text-slate-400 text-xs font-bold tracking-wider uppercase mt-1">powered by ASONIK</p>
        </div>

        {/* Card Body */}
        <div className="p-8 space-y-6">
          {error && (
            <div className="p-4 bg-amber-50 border border-amber-100 text-amber-800 text-xs font-bold rounded-2xl leading-relaxed text-left flex gap-2">
              <span className="text-lg leading-none shrink-0">⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-slate-100">
              <Shield className="w-3.5 h-3.5" /> Безопасный Вход
            </div>
            <p className="text-xs text-slate-400 font-bold leading-relaxed">
              Единая безопасная авторизация через Google аккаунт для всех членов семьи: Администраторов, Родителей и Детей.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full py-4 px-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-black text-sm transition-all flex items-center justify-center gap-3 shadow-sm cursor-pointer ${
              loading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {loading ? (
              <span className="text-xs text-slate-400 font-bold animate-pulse">Выполняется авторизация...</span>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.253-3.133C18.41 1.252 15.584 0 12.24 0 5.582 0 0 5.37 0 12s5.582 12 12.24 12c6.96 0 11.57-4.814 11.57-11.79 0-.795-.085-1.393-.19-1.925H12.24z"
                  />
                </svg>
                <span>Войти через Google</span>
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-400 font-bold leading-normal">
            * Если у ребенка еще нет привязанной Google почты, Администратор может настроить ее в Панели управления.
          </p>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400 font-black tracking-wider uppercase">
          Сделано для братьев с ❤️
        </div>
      </motion.div>
    </div>
  );
}
