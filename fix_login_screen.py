import re

with open('src/components/LoginScreen.tsx', 'r') as f:
    content = f.read()

# I will replace the main render method of LoginScreen
old_render = """  return (
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
}"""

new_render = """  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-amber-50">
      
      {/* Animated Floating Blobs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-gradient-to-r from-indigo-300/40 to-purple-300/40 blur-3xl"
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-r from-amber-300/40 to-orange-300/40 blur-3xl"
      />
      <motion.div 
        animate={{ y: [-20, 20, -20], x: [-20, 20, -20] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[20%] right-[15%] w-32 h-32 rounded-full bg-emerald-200/40 blur-2xl"
      />

      {/* Floating Emojis Decoration */}
      <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity }} className="absolute top-[15%] left-[10%] text-4xl opacity-60">🎮</motion.div>
      <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 5, repeat: Infinity, delay: 1 }} className="absolute top-[25%] right-[12%] text-5xl opacity-60">🪙</motion.div>
      <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, delay: 2 }} className="absolute bottom-[20%] left-[15%] text-4xl opacity-60">🚀</motion.div>
      <motion.div animate={{ y: [0, -25, 0] }} transition={{ duration: 6, repeat: Infinity, delay: 0.5 }} className="absolute bottom-[15%] right-[10%] text-5xl opacity-60">📦</motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden relative z-10"
      >
        {/* Card Header */}
        <div className="p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 z-0"></div>
          
          <div className="absolute top-4 right-4 z-10">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </div>

          <motion.div 
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="inline-flex p-3 rounded-2xl bg-white shadow-lg text-indigo-600 text-4xl mb-4 w-20 h-20 items-center justify-center overflow-hidden shrink-0 relative z-10 border border-slate-100"
          >
            {settings?.logo && (settings.logo.startsWith("http") || settings.logo.startsWith("data:")) ? (
              <img 
                src={settings.logo} 
                alt="Logo" 
                className="w-14 h-14 object-contain drop-shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              settings?.logo || "🏪"
            )}
          </motion.div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight relative z-10 drop-shadow-sm">
            {settings?.title && settings.title !== "Семейный Маркетплейс и Квесты" ? settings.title : "HELPER"}
          </h1>
          <p className="text-indigo-500 text-xs font-black tracking-widest uppercase mt-2 relative z-10">powered by ASONIK</p>
        </div>

        {/* Card Body */}
        <div className="p-8 space-y-6 bg-white/50 border-t border-white/50">
          {error && (
            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-xs font-bold rounded-2xl leading-relaxed text-left flex gap-3 shadow-sm">
              <span className="text-xl leading-none shrink-0">⚠️</span>
              <div>{error}</div>
            </motion.div>
          )}

          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-emerald-100 shadow-sm">
              <Shield className="w-3.5 h-3.5" /> Безопасный Вход
            </div>
            <p className="text-xs text-slate-500 font-bold leading-relaxed px-2">
              Единая безопасная авторизация через Google аккаунт для всех членов семьи: Администраторов, Родителей и Детей.
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)" }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full py-4 px-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-100 bg-white text-slate-700 font-black text-sm transition-all flex items-center justify-center gap-3 shadow-md cursor-pointer group ${
              loading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {loading ? (
              <span className="text-xs text-indigo-500 font-black animate-pulse uppercase tracking-wider">Выполняется авторизация...</span>
            ) : (
              <>
                <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.529-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.253-3.133C18.41 1.252 15.584 0 12.24 0 5.582 0 0 5.37 0 12s5.582 12 12.24 12c6.96 0 11.57-4.814 11.57-11.79 0-.795-.085-1.393-.19-1.925H12.24z"
                  />
                </svg>
                <span className="group-hover:text-indigo-600 transition-colors">Войти через Google</span>
              </>
            )}
          </motion.button>

          <p className="text-center text-[10px] text-slate-400 font-bold leading-normal px-4">
            * Если у ребенка еще нет привязанной Google почты, Администратор может настроить ее в Панели управления.
          </p>
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-100 text-center text-[10px] text-slate-400 font-black tracking-widest uppercase relative z-10 backdrop-blur-md">
          Сделано для братьев с <span className="text-rose-500 animate-pulse inline-block">❤️</span>
        </div>
      </motion.div>
    </div>
  );
}"""

content = content.replace(old_render, new_render)

with open('src/components/LoginScreen.tsx', 'w') as f:
    f.write(content)
