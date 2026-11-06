import { ArrowRight, Dices } from 'lucide-react';
import { useGameStore, useT } from '../../store/gameStore';
import type { GameState } from '../../types/game';
import { useCanAct } from '../../store/onlineStore';
import { Button } from '../Modal/Button';
import { WaitingFor } from './WaitingFor';

/** The main "roll" / "next player" button, shared by the side panel and the mobile bar. */
export function PrimaryTurnButton({ game, rolling, busy, onRoll, className = '' }: {
  game: GameState;
  rolling: boolean;
  busy: boolean;
  onRoll: () => void;
  className?: string;
}) {
  const t = useT();
  const dispatch = useGameStore((s) => s.dispatch);
  const canAct = useCanAct();
  const current = game.players[game.currentPlayerIndex];

  if ((game.phase === 'roll' || game.phase === 'end') && !canAct({ type: 'END_TURN' })) {
    return <WaitingFor player={current} className={className} />;
  }

  if (game.phase === 'roll') {
    return (
      <Button onClick={onRoll} disabled={busy} className={className}>
        <Dices className="h-5 w-5" aria-hidden />
        {rolling ? t('rolling') : game.doublesCount > 0 ? t('rollAgain') : t('rollDice')}
      </Button>
    );
  }
  if (game.phase === 'end') {
    return (
      <Button variant="secondary" disabled={busy} onClick={() => dispatch({ type: 'END_TURN' })} className={className}>
        {t('endTurn')} <ArrowRight className="h-5 w-5" aria-hidden />
      </Button>
    );
  }
  return null;
}
