import type { ChargeReason, GameState, Player } from '../types/game';
import { bankPay, bankReceive } from './bank';
import { buildingSellValue } from './building';
import { buildingLevel, getMortgageValue, transferProperty } from './property';
import { addLog, currentPlayer, getPlayer } from './state';
import { endTurn } from './turn';
import { recordPayment } from './stats';

export function hasDebt(s: GameState, playerId: string): boolean {
  return s.debts.some((d) => d.debtorId === playerId);
}

export function totalDebt(s: GameState, playerId: string): number {
  return s.debts.filter((d) => d.debtorId === playerId).reduce((sum, d) => sum + d.amount, 0);
}

/**
 * Charges `amount` from a player, paying `creditorId` (or the bank when null).
 * Returns true if paid immediately. Otherwise the amount is recorded as a debt,
 * which the player must settle (by selling / mortgaging / trading) or go bankrupt.
 */
export function chargePlayer(
  s: GameState,
  payer: Player,
  amount: number,
  creditorId: string | null,
  reason: ChargeReason = 'other',
): boolean {
  if (amount <= 0) return true;
  // Older debts are paid first, so new charges queue up behind them.
  if (!hasDebt(s, payer.id) && payer.cash >= amount) {
    payer.cash -= amount;
    if (creditorId) getPlayer(s, creditorId).cash += amount;
    else bankReceive(s, amount);
    recordPayment(s, payer.id, creditorId, amount, reason);
    return true;
  }
  s.debts.push({ debtorId: payer.id, creditorId, amount, reason });
  addLog(s, 'inDebt', {
    player: payer.name,
    amount,
    creditor: creditorId ? getPlayer(s, creditorId).name : '', // '' = the bank
  }, true);
  return false;
}

/** Most cash a player could raise by selling every building and mortgaging everything. */
export function maxRaisableCash(s: GameState, player: Player): number {
  let total = player.cash;
  for (const id of player.properties) {
    const ps = s.properties[id];
    total += buildingLevel(ps) * buildingSellValue(id);
    if (!ps.mortgaged) total += getMortgageValue(s.settings, id);
  }
  return total;
}

/** Pays the first open debt. Returns false if the debtor still lacks the cash. */
export function payFirstDebt(s: GameState): boolean {
  const debt = s.debts[0];
  if (!debt) return false;
  const debtor = getPlayer(s, debt.debtorId);
  if (debtor.cash < debt.amount) return false;
  debtor.cash -= debt.amount;
  const creditor = debt.creditorId ? getPlayer(s, debt.creditorId) : null;
  if (creditor && !creditor.bankrupt) creditor.cash += debt.amount;
  else bankReceive(s, debt.amount);
  s.debts.shift();
  recordPayment(s, debtor.id, debt.creditorId, debt.amount, debt.reason);
  addLog(s, 'debtPaid', {
    player: debtor.name, amount: debt.amount, creditor: creditor?.name ?? '',
    payerId: debtor.id, payeeId: creditor?.id ?? '',
  });
  return true;
}

/**
 * The first debtor gives up. Buildings are sold to the bank, then all cash and
 * properties go to the creditor (or back to the bank). Only allowed when the
 * debtor cannot cover the debt with cash on hand.
 */
export function declareBankruptcy(s: GameState): boolean {
  const debt = s.debts[0];
  if (!debt) return false;
  const player = getPlayer(s, debt.debtorId);
  if (player.cash >= debt.amount) return false;

  const creditorCandidate = debt.creditorId ? getPlayer(s, debt.creditorId) : null;
  const creditor = creditorCandidate && !creditorCandidate.bankrupt ? creditorCandidate : null;
  eliminatePlayer(s, player, creditor);
  addLog(s, 'bankrupt', { player: player.name }, true);
  return true;
}

/**
 * A player leaves the game (online: quit or removed by the host). Everything
 * they own returns to the bank. If it was their turn, play moves on.
 */
export function forfeitPlayer(s: GameState, playerId: string): boolean {
  const player = s.players.find((p) => p.id === playerId);
  if (!player || player.bankrupt) return false;
  const wasCurrent = currentPlayer(s).id === player.id;
  eliminatePlayer(s, player, null);
  addLog(s, 'forfeited', { player: player.name }, true);
  // Nobody is left to press "next player" for them, so advance the turn now.
  if (wasCurrent && s.players.filter((p) => !p.bankrupt).length > 1) endTurn(s);
  return true;
}

/** Releases all of a player's assets (to `creditor` or the bank) and marks them bankrupt. */
function eliminatePlayer(s: GameState, player: Player, creditor: Player | null): void {
  for (const id of [...player.properties]) {
    const ps = s.properties[id];
    const buildingValue = buildingLevel(ps) * buildingSellValue(id);
    player.cash += buildingValue;
    bankPay(s, buildingValue);
    ps.houses = 0;
    ps.hotel = false;
    transferProperty(s, id, player, creditor);
  }
  if (creditor) {
    creditor.cash += player.cash;
    creditor.getOutOfJailCards += player.getOutOfJailCards;
  } else {
    bankReceive(s, player.cash);
  }
  player.cash = 0;
  player.getOutOfJailCards = 0;
  player.inJail = false;
  player.jailTurns = 0;
  player.bankrupt = true;
  s.bankruptOrder.push(player.id);

  // Drop the player's remaining debts; money owed *to* them goes to the bank.
  s.debts = s.debts
    .filter((d) => d.debtorId !== player.id)
    .map((d) => (d.creditorId === player.id ? { ...d, creditorId: null } : d));
  if (s.pendingTrade && [s.pendingTrade.fromId, s.pendingTrade.toId].includes(player.id)) {
    s.pendingTrade = null;
  }

  if (currentPlayer(s).id === player.id) {
    s.phase = 'end';
    s.canRollAgain = false;
    s.pendingPurchase = null;
    s.pendingCard = null;
  }
}
