import type { ChargeReason, GameState, PlayerStats } from '../types/game';

export function emptyStats(): PlayerStats {
  return {
    rentPaid: 0, rentReceived: 0, taxesPaid: 0, propertiesBought: 0, housesBuilt: 0, hotelsBuilt: 0,
    passedStart: 0, jailVisits: 0, doublesRolled: 0, cardsDrawn: 0, tradesCompleted: 0, turnsPlayed: 0,
  };
}

export function addStat(s: GameState, playerId: string, key: keyof PlayerStats, amount = 1): void {
  (s.stats[playerId] ??= emptyStats())[key] += amount;
}

/** Records a completed payment in the statistics. */
export function recordPayment(
  s: GameState,
  payerId: string,
  creditorId: string | null,
  amount: number,
  reason: ChargeReason,
): void {
  if (reason === 'rent') {
    addStat(s, payerId, 'rentPaid', amount);
    if (creditorId) addStat(s, creditorId, 'rentReceived', amount);
  } else if (reason === 'tax') {
    addStat(s, payerId, 'taxesPaid', amount);
  }
}
