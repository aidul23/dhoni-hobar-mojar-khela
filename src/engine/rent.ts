import { TRANSPORT_RENTS, UTILITY_MULTIPLIERS } from '../data/properties';
import type { GameState } from '../types/game';
import { countOwnedInGroup, getPropertyDef, ownsFullGroup } from './property';

/**
 * Rent owed for landing on a property. Returns 0 when unowned or mortgaged.
 * `diceTotal` is only used for utilities.
 */
export function calculateRent(s: GameState, propertyId: string, diceTotal: number): number {
  const def = getPropertyDef(propertyId);
  const ps = s.properties[propertyId];
  if (!ps.ownerId || ps.mortgaged) return 0;

  switch (def.kind) {
    case 'street': {
      if (ps.hotel) return def.rents[5];
      if (ps.houses > 0) return def.rents[ps.houses];
      const base = def.rents[0];
      return ownsFullGroup(s, ps.ownerId, propertyId) ? base * 2 : base;
    }
    case 'transport': {
      const count = countOwnedInGroup(s, ps.ownerId, propertyId);
      return TRANSPORT_RENTS[count - 1] ?? 0;
    }
    case 'utility': {
      const count = countOwnedInGroup(s, ps.ownerId, propertyId);
      return diceTotal * (UTILITY_MULTIPLIERS[count - 1] ?? 0);
    }
  }
}
