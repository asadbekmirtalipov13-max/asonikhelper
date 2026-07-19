const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const faqSectionStr = `
            {/* FAQ Section */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2 mb-4">
                <HelpCircle className="w-4 h-4 text-indigo-500" />
                Частые вопросы (FAQ)
              </h4>
              <div className="space-y-3">
                {(settings.faqs || []).map((faq) => (
                  <div key={faq.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                    <button
                      onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
                      className="w-full text-left p-4 font-bold text-slate-700 text-sm flex justify-between items-center hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      {faq.question}
                      <span className="text-slate-400 font-black">{openFaq === faq.id ? "—" : "+"}</span>
                    </button>
                    <AnimatePresence>
                      {openFaq === faq.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-4 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-100"
                        >
                          <div className="pt-3">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
                {(!settings.faqs || settings.faqs.length === 0) && (
                  <div className="text-center p-4 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    Здесь пока нет вопросов.
                  </div>
                )}
              </div>
            </div>
`;

content = content.replace(
  /\{\/\* Transaction History Log \*\/\}/,
  faqSectionStr + "\n\n            {/* Transaction History Log */}"
);

fs.writeFileSync('src/components/KidDashboard.tsx', content);
