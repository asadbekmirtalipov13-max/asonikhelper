import re

with open('src/components/ParentDashboard.tsx', 'r') as f:
    content = f.read()

# First UI element: thumbnail
old_thumb = """                        {chore.proofPhoto && (
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
                              Нажмите, чтобы проверить
                            </div>
                          </div>
                        )}"""

new_thumb = """                        {chore.proofPhoto && (
                          <div 
                            onClick={() => setReviewChore(chore)}
                            className="aspect-video w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-100 relative group cursor-zoom-in"
                          >
                            <img 
                              src={chore.proofPhoto.includes(',') ? chore.proofPhoto.split(',')[0] : chore.proofPhoto} 
                              alt="Proof" 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                              referrerPolicy="no-referrer"
                            />
                            {chore.proofPhoto.includes(',') && (
                                <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
                                  + {chore.proofPhoto.split(',').length - 1} фото
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-all">
                              Нажмите, чтобы проверить
                            </div>
                          </div>
                        )}"""
content = content.replace(old_thumb, new_thumb)

# Second UI element: modal view
old_modal = """                {reviewChore.proofPhoto && (
                  <div className="w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner">
                    <img 
                      src={reviewChore.proofPhoto} 
                      alt="Proof submission" 
                      className="w-full object-contain max-h-[300px]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}"""

new_modal = """                {reviewChore.proofPhoto && (
                  <div className="w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shadow-inner space-y-2 max-h-[300px] overflow-y-auto p-2">
                    {reviewChore.proofPhoto.split(',').map((url, idx) => (
                      <div key={idx} className="relative">
                          {reviewChore.isWeekly && <div className="absolute top-2 left-2 bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded-lg z-10 shadow-sm">День {idx + 1}</div>}
                          <img 
                            src={url} 
                            alt={`Proof ${idx+1}`} 
                            className="w-full rounded-xl object-contain"
                            referrerPolicy="no-referrer"
                          />
                      </div>
                    ))}
                  </div>
                )}"""
content = content.replace(old_modal, new_modal)

with open('src/components/ParentDashboard.tsx', 'w') as f:
    f.write(content)
