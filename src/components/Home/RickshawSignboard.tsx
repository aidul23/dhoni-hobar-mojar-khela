import { PeacockFeather } from '../Decor/PeacockFeather';
import { RickshawWheel } from '../Decor/RickshawWheel';
import { useT } from '../../store/gameStore';
import { Flower } from '../Decor/Flower';

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

          <div className="flex items-end justify-center gap-3" aria-hidden>
            <PeacockFeather className="h-12 w-8 -rotate-12 sm:h-14 sm:w-9" />
            <RickshawWheel className="h-11 w-11 animate-[spin_12s_linear_infinite] sm:h-12 sm:w-12" />
            <PeacockFeather className="h-12 w-8 rotate-12 sm:h-14 sm:w-9" />
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
