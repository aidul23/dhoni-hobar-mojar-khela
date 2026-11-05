import type { GameState, Player } from '../types/game';
import { totalDebt } from './bankruptcy';
import { buildingLevel, getMortgageValue, getPrice, getPropertyDef } from './property';

/**
 * Cash + property value + building value − open debts.
 * A mortgaged property counts only its equity (price − mortgage value).
 */
export function netWorth(s: GameState, player: Player): number {
  if (player.bankrupt) return 0;
  let total = player.cash - totalDebt(s, player.id);
  for (const id of player.properties) {
    const ps = s.properties[id];
    const price = getPrice(s.settings, id);
    total += ps.mortgaged ? price - getMortgageValue(s.settings, id) : price;
    total += buildingLevel(ps) * getPropertyDef(id).houseCost;
  }
  return total;
}

/** Richest active player (ties: earlier seat wins). */
export function richestPlayer(s: GameState): Player {
  const active = s.players.filter((p) => !p.bankrupt);
  return active.reduce((best, p) => (netWorth(s, p) > netWorth(s, best) ? p : best), active[0]);
}

/**
 * Final standings: the winner first, then remaining active players by net worth,
 * then bankrupt players (the last to go bankrupt ranks highest).
 */
export function finalRanking(s: GameState): Player[] {
  const winner = s.players.find((p) => p.id === s.winnerId);
  const active = s.players
    .filter((p) => !p.bankrupt && p.id !== s.winnerId)
    .sort((a, b) => netWorth(s, b) - netWorth(s, a));
  const bankrupt = [...s.bankruptOrder]
    .reverse()
    .map((id) => s.players.find((p) => p.id === id))
    .filter((p): p is Player => !!p);
  return [...(winner ? [winner] : []), ...active, ...bankrupt];
}
