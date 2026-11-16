import { Plus, X } from 'lucide-react';
import { useT } from '../../store/gameStore';
import type { PlayerSetup } from '../../types/game';
import { PlayerFields } from '../Setup/SetupParts';

/** One player's setup as a colourful ticket: their colour on top, their token as a big avatar. */
export function PlayerTicket({ player, title, onChange, onRemove }: {
  player: PlayerSetup;
  title: string;
  onChange: (patch: Partial<PlayerSetup>) => void;
  onRemove?: () => void;
}) {
  const t = useT();
  return (
    <section className="animate-pop overflow-hidden rounded-2xl bg-white shadow-[0_5px_0_rgba(0,0,0,0.1)] ring-1 ring-black/5">
      <header className="relative flex h-14 items-start justify-between px-3 pt-2 transition-colors" style={{ background: player.color }}>
        <h3 className="text-sm font-bold text-white/90">{title}</h3>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={t('removeFromGame')}
            title={t('removeFromGame')}
            className="rounded-full bg-white/25 p-1 text-white hover:bg-white/40"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
        <span
          key={player.token}
          className="animate-pop absolute -bottom-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-4 bg-white text-3xl shadow-md"
          style={{ borderColor: player.color }}
        >
          {player.token}
        </span>
      </header>
      <div className="p-4 pt-9">
        <PlayerFields player={player} onChange={onChange} />
      </div>
    </section>
  );
}

/** Dashed placeholder card that adds another player. */
export function AddPlayerCard({ onClick }: { onClick: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-stone-400/70 bg-white/50 font-bold text-stone-500 transition hover:border-emerald-600 hover:bg-white hover:text-emerald-700"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-stone-200 transition group-hover:scale-110 group-hover:bg-emerald-100">
        <Plus className="h-8 w-8" strokeWidth={3} aria-hidden />
      </span>
      {t('addPlayer')}
    </button>
  );
}
