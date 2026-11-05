import type { GameState, WinReason } from '../types/game';
import { TOTAL_PROPERTIES } from './property';
import { richestPlayer } from './ranking';
import { activePlayers, addLog } from './state';

/** Ends the game if a win condition is met. */
export function checkVictory(s: GameState): void {
  if (s.phase === 'gameOver') return;
  const active = activePlayers(s);

  if (active.length === 1) {
    setWinner(s, active[0].id, 'lastStanding');
    addLog(s, 'winner', { player: active[0].name }, true);
    return;
  }

  const pct = s.settings.victoryPercent;
  if (pct) {
    const leader = active.find((p) => (p.properties.length / TOTAL_PROPERTIES) * 100 >= pct);
    if (leader) {
      setWinner(s, leader.id, 'ownership');
      addLog(s, 'winnerByOwnership', { player: leader.name, percent: pct }, true);
      return;
    }
  }

  // The round counter only advances on END_TURN, which requires no open debts.
  const limit = s.settings.turnLimit;
  if (limit && s.round > limit && s.debts.length === 0) {
    const leader = richestPlayer(s);
    setWinner(s, leader.id, 'turnLimit');
    addLog(s, 'winnerByTurnLimit', { player: leader.name, rounds: limit }, true);
  }
}

function setWinner(s: GameState, playerId: string, reason: WinReason): void {
  s.winnerId = playerId;
  s.winReason = reason;
  s.phase = 'gameOver';
  s.pendingCard = null;
  s.pendingPurchase = null;
  s.pendingTrade = null;
}
