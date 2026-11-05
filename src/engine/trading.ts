import type { GameState, TradeOffer } from '../types/game';
import { groupHasBuildings, transferProperty } from './property';
import { addLog, getPlayer } from './state';
import { addStat } from './stats';

export type TradeCheck =
  | 'ok'
  | 'samePlayer'
  | 'inactivePlayer'
  | 'empty'
  | 'badAmount'
  | 'offerCashTooHigh'
  | 'requestCashTooHigh'
  | 'notTradable';

/** Only unmortgaged properties whose colour group has no buildings may change hands. */
export function isTradable(s: GameState, propertyId: string, ownerId: string): boolean {
  const ps = s.properties[propertyId];
  return !!ps && ps.ownerId === ownerId && !ps.mortgaged && !groupHasBuildings(s, propertyId);
}

const validAmount = (n: number) => Number.isInteger(n) && n >= 0;
const unique = (ids: string[]) => new Set(ids).size === ids.length;

export function validateTrade(s: GameState, offer: TradeOffer): TradeCheck {
  if (offer.fromId === offer.toId) return 'samePlayer';
  const from = s.players.find((p) => p.id === offer.fromId);
  const to = s.players.find((p) => p.id === offer.toId);
  if (!from || !to || from.bankrupt || to.bankrupt) return 'inactivePlayer';
  if (!validAmount(offer.offerCash) || !validAmount(offer.requestCash)) return 'badAmount';
  const nothing =
    offer.offerCash === 0 && offer.requestCash === 0 &&
    offer.offerProperties.length === 0 && offer.requestProperties.length === 0;
  if (nothing) return 'empty';
  if (offer.offerCash > from.cash) return 'offerCashTooHigh';
  if (offer.requestCash > to.cash) return 'requestCashTooHigh';
  if (!unique(offer.offerProperties) || !unique(offer.requestProperties)) return 'notTradable';
  if (!offer.offerProperties.every((id) => isTradable(s, id, from.id))) return 'notTradable';
  if (!offer.requestProperties.every((id) => isTradable(s, id, to.id))) return 'notTradable';
  return 'ok';
}

/** Applies a validated trade. Returns false (and changes nothing) if invalid. */
export function executeTrade(s: GameState, offer: TradeOffer): boolean {
  if (validateTrade(s, offer) !== 'ok') return false;
  const from = getPlayer(s, offer.fromId);
  const to = getPlayer(s, offer.toId);
  from.cash += offer.requestCash - offer.offerCash;
  to.cash += offer.offerCash - offer.requestCash;
  for (const id of offer.offerProperties) transferProperty(s, id, from, to);
  for (const id of offer.requestProperties) transferProperty(s, id, to, from);
  addStat(s, from.id, 'tradesCompleted');
  addStat(s, to.id, 'tradesCompleted');
  addLog(s, 'tradeAccepted', { from: from.name, to: to.name }, true);
  return true;
}
