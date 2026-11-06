import { localizeDigits } from '../../utils/currency';
import { CircleHelp, Gift } from 'lucide-react';
import { getCard } from '../../engine/cards';
import { useGameStore, useT } from '../../store/gameStore';
import { useCanAct } from '../../store/onlineStore';
import type { Player } from '../../types/game';
import { WaitingFor } from '../GameControls/WaitingFor';
import { Button } from '../Modal/Button';

export function CardModal({ cardId, drawnBy }: { cardId: string; drawnBy: Player }) {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  const dispatch = useGameStore((s) => s.dispatch);
  const card = getCard(cardId);
  const isChance = card.deck === 'chance';
  const mine = useCanAct()({ type: 'RESOLVE_CARD' });

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div
        className={`animate-flip w-full max-w-xs rounded-2xl border-4 p-6 text-center shadow-2xl
          ${isChance ? 'border-orange-400 bg-orange-50' : 'border-sky-400 bg-sky-50'}`}
      >
        <div className="flex justify-center">
          {isChance
            ? <CircleHelp className="h-14 w-14 text-orange-600" strokeWidth={2} aria-hidden />
            : <Gift className="h-14 w-14 text-sky-600" strokeWidth={2} aria-hidden />}
        </div>
        <h2 className={`mt-2 text-2xl font-bold ${isChance ? 'text-orange-700' : 'text-sky-700'}`}>
          {t(card.deck)}
        </h2>
        <p className="my-5 min-h-12 text-lg text-stone-800">{localizeDigits(card[lang], lang)}</p>
        {mine
          ? <Button onClick={() => dispatch({ type: 'RESOLVE_CARD' })} className="w-full">{t('ok')}</Button>
          : <WaitingFor player={drawnBy} />}
      </div>
    </div>
  );
}
