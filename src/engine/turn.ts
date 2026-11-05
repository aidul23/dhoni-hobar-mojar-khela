import type { GameState, Player } from '../types/game';
import { addLog, currentPlayer } from './state';
import { addStat } from './stats';

/** Index of the next non-bankrupt player after `fromIndex`. */
export function nextActivePlayerIndex(players: Player[], fromIndex: number): number {
  for (let i = 1; i <= players.length; i++) {
    const idx = (fromIndex + i) % players.length;
    if (!players[idx].bankrupt) return idx;
  }
  return fromIndex;
}

/**
 * Called once the landing / action of a roll is fully resolved.
 * Lets the player roll again after doubles, otherwise waits for "end turn".
 */
export function finishAction(s: GameState): void {
  if (s.phase === 'gameOver') return;
  s.pendingPurchase = null;
  s.pendingCard = null;
  const p = currentPlayer(s);
  s.phase = !p.bankrupt && !p.inJail && s.canRollAgain ? 'roll' : 'end';
}

export function endTurn(s: GameState): void {
  const previous = s.currentPlayerIndex;
  s.currentPlayerIndex = nextActivePlayerIndex(s.players, previous);
  // Wrapping back around the table starts a new round.
  if (s.currentPlayerIndex <= previous) s.round += 1;
  addStat(s, currentPlayer(s).id, 'turnsPlayed');
  s.phase = 'roll';
  s.doublesCount = 0;
  s.canRollAgain = false;
  s.pendingPurchase = null;
  s.pendingCard = null;
  s.turnNumber += 1;
  addLog(s, 'turnStart', { player: currentPlayer(s).name });
}
