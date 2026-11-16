import { ChevronRight, Crown, Dices, HandCoins, House, type LucideIcon } from 'lucide-react';
import { Fragment } from 'react';
import { useT } from '../../store/gameStore';
import { formatNumber } from '../../utils/currency';

const STEPS: { icon: LucideIcon; color: string; tint: string }[] = [
  { icon: Dices, color: '#be123c', tint: '#ffe4e6' },
  { icon: House, color: '#047857', tint: '#d1fae5' },
  { icon: HandCoins, color: '#b45309', tint: '#fef3c7' },
  { icon: Crown, color: '#1d4ed8', tint: '#dbeafe' },
];

/** Four painted cards: roll → buy → collect rent → win. */
export function HowToPlay() {
  const t = useT();
  return (
    <section aria-labelledby="how-to-play">
      <h2 id="how-to-play" className="mb-4 text-center">
        <span className="inline-block -rotate-1 rounded-lg border-2 border-[#7c2d12] bg-[#facc15] px-5 py-1 text-xl font-bold text-[#7c2d12] shadow-[3px_3px_0_#7c2d12]">
          {t('howToPlay')}
        </span>
      </h2>
      <ol className="grid grid-cols-2 gap-3 lg:flex lg:items-stretch lg:gap-1">
        {STEPS.map(({ icon: Icon, color, tint }, i) => (
          <Fragment key={i}>
            {i > 0 && (
              <li aria-hidden className="hidden items-center text-[#7c2d12]/60 lg:flex">
                <ChevronRight className="h-7 w-7" strokeWidth={3} />
              </li>
            )}
            <li
              className="relative flex-1 rounded-2xl border-[3px] bg-white p-4 pt-5 text-center shadow-[0_5px_0_rgba(0,0,0,0.12)] transition hover:-translate-y-1"
              style={{ borderColor: color }}
            >
              <span
                className="absolute -left-2 -top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm font-bold text-white shadow"
                style={{ background: color }}
              >
                {formatNumber(i + 1)}
              </span>
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full" style={{ background: tint }}>
                <Icon className="h-9 w-9" style={{ color }} strokeWidth={2.2} aria-hidden />
              </span>
              <h3 className="mt-3 text-lg font-bold" style={{ color }}>{t(`step${i + 1}Title`)}</h3>
              <p className="mt-1 text-sm text-stone-600">{t(`step${i + 1}Desc`)}</p>
            </li>
          </Fragment>
        ))}
      </ol>
    </section>
  );
}
