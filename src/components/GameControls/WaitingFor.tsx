import { useT } from '../../store/gameStore';
import type { Player } from '../../types/game';

/** Shown online instead of buttons that belong to another player. */
export function WaitingFor({ player, className = '' }: { player: Player; className?: string }) {
  const t = useT();
  return (
    <p className={`animate-pulse rounded-lg bg-stone-100 px-3 py-2 text-center text-sm font-semibold text-stone-600 ${className}`}>
      ⏳ {t('waitingFor', { player: `${player.token} ${player.name}` })}
    </p>
  );
}
