const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const placeholder = `<div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-3xl">
            <p className="text-slate-500 font-medium text-sm">Здесь будет возможность создавать новые промокоды на монетки. Функция скоро появится в полном объеме.</p>
          </div>`;

const realPromoUI = `
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="font-bold text-sm text-slate-800 mb-4">Создать новый промокод</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Код</label>
                  <input type="text" id="newPromoCode" placeholder="GIFT2024" className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Монеты</label>
                  <input type="number" id="newPromoPoints" defaultValue={10} min={1} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Активаций</label>
                  <input type="number" id="newPromoLimit" defaultValue={1} min={1} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold" />
                </div>
              </div>
              <button 
                onClick={async () => {
                  const codeInput = document.getElementById("newPromoCode");
                  const pointsInput = document.getElementById("newPromoPoints");
                  const limitInput = document.getElementById("newPromoLimit");
                  
                  const code = codeInput?.value?.trim().toUpperCase();
                  const points = Number(pointsInput?.value);
                  const limit = Number(limitInput?.value);
                  
                  if (!code || points <= 0 || limit <= 0) return;
                  
                  try {
                    const promoId = "promo-" + Math.random().toString(36).substr(2, 9);
                    await setDoc(doc(db, "promocodes", promoId), {
                      id: promoId,
                      code,
                      points,
                      activationsLeft: limit,
                      active: true,
                      createdAt: new Date()
                    });
                    codeInput.value = "";
                    pointsInput.value = "10";
                    limitInput.value = "1";
                    alert("Промокод создан!");
                  } catch(e) { console.error(e); }
                }}
                className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
              >
                Создать промокод
              </button>
            </div>
            
            <div className="space-y-3" id="promoListContainer">
              {/* Promocodes will be loaded and listed here. 
                  Since AdminPanel doesn't currently subscribe to promocodes, we'll fetch them on mount. */}
              <PromoList db={db} />
            </div>
          </div>`;

// Wait, I can't just inject a new React component <PromoList /> inside the file unless I define it.
// Let's create the PromoList component and prepend it to the file.

const promoListComponent = \`
const PromoList = ({ db }: any) => {
  const [promos, setPromos] = React.useState<any[]>([]);
  React.useEffect(() => {
    const fetchPromos = async () => {
      try {
        const snap = await getDocs(collection(db, "promocodes"));
        setPromos(snap.docs.map(d => d.data()));
      } catch(e) { console.error(e); }
    };
    fetchPromos();
    const interval = setInterval(fetchPromos, 5000);
    return () => clearInterval(interval);
  }, [db]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {promos.length === 0 && <p className="text-slate-400 text-sm p-4">Нет созданных промокодов</p>}
      {promos.map(p => (
        <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex justify-between items-center shadow-sm">
          <div>
            <h4 className="font-black text-slate-800 text-lg tracking-wider">{p.code}</h4>
            <p className="text-xs font-bold text-indigo-500 mt-1">{p.points} монет • Осталось: {p.activationsLeft}</p>
          </div>
          <button 
            onClick={async () => {
              if (window.confirm("Удалить этот промокод?")) {
                await deleteDoc(doc(db, "promocodes", p.id));
              }
            }}
            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg transition-colors cursor-pointer"
          >
            Удалить
          </button>
        </div>
      ))}
    </div>
  );
};
\`;

if (!content.includes('const PromoList =')) {
  content = content.replace('export default function AdminPanel', promoListComponent + '\\nexport default function AdminPanel');
}
content = content.replace(placeholder, realPromoUI);

const oldButton = \`onClick={() => showAlert("В разработке", "Раздел промокодов еще дорабатывается!")}\`;
content = content.replace(oldButton, \`onClick={() => {}}\`);

fs.writeFileSync('src/components/AdminPanel.tsx', content);
