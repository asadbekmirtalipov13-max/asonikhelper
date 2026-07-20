import re

with open('src/components/KidDashboard.tsx', 'r') as f:
    content = f.read()

# handleSubmitProof
old_proof_logic = """      // 2. Save proof photo and update status in database
      
      const choreRef = doc(db, "chores", submittingChore.id);
      await updateDoc(choreRef, {
        status: "completed",
        proofPhoto: uploadedUrl,
        completedAt: new Date()
      });
      
      // 3. Send Telegram notify to Parent
      if (settings.telegramChatId) {
        await sendTelegramNotification(
          `📸 <b>Отчет по заданию отправлен!</b>\\nРебенок: ${currentUser.name} ${currentUser.avatar}\\nКвест: <b>${submittingChore.title}</b>\\n\\n<i>Родители, пожалуйста, проверьте отчет и оцените старания!</i>`,
          settings.telegramChatId
        );
      }
      
      showAlert("Ура! 🎉", "Отчет успешно отправлен родителям на проверку! Ожидайте баллов! 🪙");"""

new_proof_logic = """      // 2. Save proof photo and update status in database
      
      const choreRef = doc(db, "chores", submittingChore.id);
      
      if (submittingChore.isWeekly) {
         const currentProgress = submittingChore.weeklyProgress || [];
         const newProgress = [...currentProgress, uploadedUrl];
         const daysLogged = (submittingChore.weeklyDaysLogged || 0) + 1;
         const now = new Date();
         const todayStr = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
         
         if (daysLogged >= 7) {
            await updateDoc(choreRef, {
               status: "completed",
               proofPhoto: newProgress.join(','), // Store all as comma-separated
               weeklyProgress: newProgress,
               weeklyDaysLogged: daysLogged,
               lastWeeklySubmission: todayStr,
               completedAt: new Date()
            });
            
            if (settings.telegramChatId) {
              await sendTelegramNotification(
                `📸 <b>Еженедельный отчет полностью завершен! (7/7 дней)</b>\\nРебенок: ${currentUser.name} ${currentUser.avatar}\\nКвест: <b>${submittingChore.title}</b>\\n\\n<i>Все фото загружены. Родители, пожалуйста, проверьте отчет и выдайте награду!</i>`,
                settings.telegramChatId
              );
            }
            showAlert("Ура! 🎉", "Еженедельный отчет (7/7) успешно отправлен родителям на проверку! Ожидайте баллов! 🪙");
         } else {
            await updateDoc(choreRef, {
               weeklyProgress: newProgress,
               weeklyDaysLogged: daysLogged,
               lastWeeklySubmission: todayStr
            });
            showAlert("Супер! 📸", `Фото за день ${daysLogged} из 7 загружено! Возвращайся завтра!`);
         }
      } else {
          await updateDoc(choreRef, {
            status: "completed",
            proofPhoto: uploadedUrl,
            completedAt: new Date()
          });
          
          if (settings.telegramChatId) {
            await sendTelegramNotification(
              `📸 <b>Отчет по заданию отправлен!</b>\\nРебенок: ${currentUser.name} ${currentUser.avatar}\\nКвест: <b>${submittingChore.title}</b>\\n\\n<i>Родители, пожалуйста, проверьте отчет и оцените старания!</i>`,
              settings.telegramChatId
            );
          }
          showAlert("Ура! 🎉", "Отчет успешно отправлен родителям на проверку! Ожидайте баллов! 🪙");
      }"""

content = content.replace(old_proof_logic, new_proof_logic)

# Active chores UI - title and description
old_ui_title = """                      <h4 className="font-bold text-slate-800 text-sm leading-tight pt-1">{chore.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">{chore.description}</p>

                      {chore.parentFeedback && ("""

new_ui_title = """                      <h4 className="font-bold text-slate-800 text-sm leading-tight pt-1">{chore.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed">{chore.description}</p>
                      
                      {chore.isWeekly && (
                        <div className="pt-2">
                          <div className="text-[10px] font-bold text-indigo-600 mb-1">Прогресс квеста: {chore.weeklyDaysLogged || 0}/7 дней</div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                             <div className="bg-indigo-500 h-full transition-all" style={{ width: `${((chore.weeklyDaysLogged || 0) / 7) * 100}%` }}></div>
                          </div>
                          {chore.lastWeeklySubmission === `${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()}` && (
                             <div className="text-[10px] text-emerald-600 font-bold mt-1">✓ Фото за сегодня отправлено</div>
                          )}
                        </div>
                      )}

                      {chore.parentFeedback && ("""

content = content.replace(old_ui_title, new_ui_title)

# Submit button UI
old_submit_btn = """                    <div className="space-y-2">
                      <button
                        onClick={() => setSubmittingChore(chore)}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Camera className="w-4 h-4" /> Сдать отчет (фотоотчет) 📸
                      </button>"""

new_submit_btn = """                    <div className="space-y-2">
                      {(() => {
                         const todayStr = `${new Date().getFullYear()}-${new Date().getMonth()+1}-${new Date().getDate()}`;
                         const alreadySubmittedToday = chore.isWeekly && chore.lastWeeklySubmission === todayStr;
                         return (
                            <button
                              onClick={() => !alreadySubmittedToday && setSubmittingChore(chore)}
                              disabled={alreadySubmittedToday}
                              className={`w-full py-2.5 ${alreadySubmittedToday ? 'bg-emerald-100 text-emerald-600 cursor-not-allowed opacity-80' : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'} text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5`}
                            >
                              {alreadySubmittedToday ? <Check className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                              {alreadySubmittedToday ? 'Отчет за сегодня сдан! Приходи завтра' : 'Сдать отчет (фотоотчет) 📸'}
                            </button>
                         );
                      })()}"""

content = content.replace(old_submit_btn, new_submit_btn)

with open('src/components/KidDashboard.tsx', 'w') as f:
    f.write(content)
