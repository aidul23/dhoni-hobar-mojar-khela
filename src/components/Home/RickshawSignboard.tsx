import { useT } from '../../store/gameStore';

/** A five-petal flower, the most common rickshaw-art motif. */
function Flower({ className = '', petal = '#e11d48', center = '#facc15' }: { className?: string; petal?: string; center?: string }) {
  const petals = Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * (Math.PI / 180);
    return { cx: 20 + Math.cos(a) * 8, cy: 20 + Math.sin(a) * 8 };
  });
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      {petals.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r="7" fill={petal} stroke="#fff" strokeWidth="1.5" />
      ))}
      <circle cx="20" cy="20" r="6" fill={center} stroke="#7c2d12" strokeWidth="1.5" />
    </svg>
  );
}

/** Title on a painted signboard, in the style of Bangladeshi rickshaw art. */
export function RickshawSignboard() {
  const t = useT();
  return (
    <div className="relative mx-auto max-w-2xl px-1">
      <div className="rickshaw-frame rounded-[2rem] p-[7px] shadow-[0_8px_0_#7f1d1d,0_16px_28px_rgba(0,0,0,0.25)]">
        <div className="relative overflow-hidden rounded-[1.6rem] border-4 border-white bg-gradient-to-b from-[#0f766e] via-[#115e59] to-[#134e4a] px-5 pb-6 pt-5 text-center sm:px-10">
          <Flower className="absolute -left-3 -top-3 h-14 w-14" />
          <Flower className="absolute -right-3 -top-3 h-14 w-14" petal="#f59e0b" center="#e11d48" />
          <Flower className="absolute -bottom-3 -left-3 h-12 w-12" petal="#db2777" />
          <Flower className="absolute -bottom-3 -right-3 h-12 w-12" petal="#2563eb" center="#facc15" />

          <div className="flex items-center justify-center gap-3 text-4xl sm:text-5xl" aria-hidden>
            <span className="-scale-x-100">🦚</span>
            <span>🛺</span>
            <span>🦚</span>
          </div>
          <h1 className="rickshaw-title mt-2 text-5xl sm:text-6xl">{t('title')}</h1>
          <p className="mt-4 inline-block rounded-full border-2 border-[#7c2d12] bg-[#facc15] px-5 py-1 font-semibold text-[#7c2d12] shadow-[2px_2px_0_#7c2d12]">
            {t('subtitle')}
          </p>
        </div>
      </div>
    </div>
  );
}
