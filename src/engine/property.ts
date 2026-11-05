import { bankReceive } from './bank';
import { GROUP_MEMBERS, PROPERTIES, PROPERTY_LIST } from '../data/properties';
import type { GameSettings, GameState, Player, PropertyDef, PropertyState } from '../types/game';

export function freshPropertyState(): PropertyState {
  return { ownerId: null, houses: 0, hotel: false, mortgaged: false };
}

export function getPropertyDef(id: string): PropertyDef {
  const def = PROPERTIES[id];
  if (!def) throw new Error(`Unknown property ${id}`);
  return def;
}

/** Purchase price after applying the game-mode multiplier. */
export function getPrice(settings: GameSettings, id: string): number {
  const base = getPropertyDef(id).price;
  return Math.round((base * settings.priceMultiplier) / 10) * 10;
}

export function getMortgageValue(settings: GameSettings, id: string): number {
  return Math.round(getPrice(settings, id) / 20) * 10;
}

/** Cost to lift a mortgage: mortgage value + 10% fee. */
export function getUnmortgageCost(settings: GameSettings, id: string): number {
  return Math.round(getMortgageValue(settings, id) * 1.1);
}

export function groupIds(propertyId: string): string[] {
  return GROUP_MEMBERS[getPropertyDef(propertyId).group];
}

/** 0-4 = houses, 5 = hotel. */
export function buildingLevel(ps: PropertyState): number {
  return ps.hotel ? 5 : ps.houses;
}

export function groupHasBuildings(s: GameState, propertyId: string): boolean {
  return groupIds(propertyId).some((id) => buildingLevel(s.properties[id]) > 0);
}

export function ownsFullGroup(s: GameState, ownerId: string, propertyId: string): boolean {
  const { group } = getPropertyDef(propertyId);
  return GROUP_MEMBERS[group].every((id) => s.properties[id].ownerId === ownerId);
}

export function countOwnedInGroup(s: GameState, ownerId: string, propertyId: string): number {
  const { group } = getPropertyDef(propertyId);
  return GROUP_MEMBERS[group].filter((id) => s.properties[id].ownerId === ownerId).length;
}

export function canBuy(s: GameState, player: Player, propertyId: string): boolean {
  return s.properties[propertyId].ownerId === null && player.cash >= getPrice(s.settings, propertyId);
}

/** Buys an unowned property from the bank. Returns false if not allowed. */
export function buyProperty(s: GameState, player: Player, propertyId: string): boolean {
  if (!canBuy(s, player, propertyId)) return false;
  const price = getPrice(s.settings, propertyId);
  player.cash -= price;
  bankReceive(s, price);
  s.properties[propertyId].ownerId = player.id;
  player.properties.push(propertyId);
  return true;
}

/** Moves ownership between players (or back to the bank when `to` is null). */
export function transferProperty(s: GameState, propertyId: string, from: Player, to: Player | null): void {
  from.properties = from.properties.filter((id) => id !== propertyId);
  if (to) {
    s.properties[propertyId].ownerId = to.id;
    to.properties.push(propertyId);
  } else {
    s.properties[propertyId] = freshPropertyState();
  }
}

export const TOTAL_PROPERTIES = PROPERTY_LIST.length;
