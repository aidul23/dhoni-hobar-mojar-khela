import { PROPERTY_LIST } from '../data/properties';
import type { GameState } from '../types/game';

/** The bank has unlimited money; we only keep totals for the bank panel. */
export function bankReceive(s: GameState, amount: number): void {
  if (amount > 0) s.bank.received += amount;
}

export function bankPay(s: GameState, amount: number): void {
  if (amount > 0) s.bank.paid += amount;
}

export function housesInUse(s: GameState): number {
  return Object.values(s.properties).reduce((n, ps) => n + (ps.hotel ? 0 : ps.houses), 0);
}

export function hotelsInUse(s: GameState): number {
  return Object.values(s.properties).filter((ps) => ps.hotel).length;
}

/** Houses still in the bank, or null when the supply is unlimited. */
export function housesLeft(s: GameState): number | null {
  const limit = s.settings.houseLimit;
  return limit ? Math.max(0, limit - housesInUse(s)) : null;
}

export function hotelsLeft(s: GameState): number | null {
  const limit = s.settings.hotelLimit;
  return limit ? Math.max(0, limit - hotelsInUse(s)) : null;
}

/** Properties nobody has bought yet. */
export function unsoldProperties(s: GameState): string[] {
  return PROPERTY_LIST.map((p) => p.id).filter((id) => s.properties[id].ownerId === null);
}
