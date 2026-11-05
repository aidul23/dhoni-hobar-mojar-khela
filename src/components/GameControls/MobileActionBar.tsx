import type { GameState } from '../../types/game';
import { formatMoney } from '../../utils/currency';
import { Dice } from '../Dice/Dice';
import { PrimaryTurnButton } from './PrimaryTurnButton';

/** Fixed bottom bar on small screens so the main action is always within reach. */
export function MobileActionBar({ game, faces, rolling, busy, onRoll }: {
  game: GameState;
  faces: [number, number];
  rolling: boolean;
  busy: boolean;
  onRoll: () => void;
}) {
  if (game.phase === 'gameOver') return null;
  const player = game.players[game.currentPlayerIndex];
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-xl items-center gap-3">
        <span className="text-2xl">{player.token}</span>
        <div className="min-w-0">
          <div className="truncate text-sm font-bold" style={{ color: player.color }}>{player.name}</div>
          <div className="text-sm font-semibold tabular-nums">{formatMoney(player.cash)}</div>
        </div>
        <Dice faces={faces} rolling={rolling} size="1.9rem" />
        <PrimaryTurnButton game={game} rolling={rolling} busy={busy} onRoll={onRoll} className="whitespace-nowrap text-sm" />
      </div>
    </div>
  );
}
