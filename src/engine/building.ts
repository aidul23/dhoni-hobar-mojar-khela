import { PROPERTY_POSITIONS } from '../data/board';
import type { GameState, Player } from '../types/game';
import { buildingLevel, getPropertyDef, groupIds, ownsFullGroup } from './property';
import { bankPay, bankReceive, hotelsLeft, housesLeft } from './bank';
import { addLog } from './state';
import { addStat } from './stats';

/** 'ok' or the reason an action is not allowed (translated in the UI as `reason.<code>`). */
export type Check =
  | 'ok'
  | 'notStreet'
  | 'notOwner'
  | 'needGroup'
  | 'mortgagedGroup'
  | 'uneven'
  | 'maxHouses'
  | 'hasHotel'
  | 'needFourHouses'
  | 'noBuildings'
  | 'noHousesLeft'
  | 'noHotelsLeft'
  | 'noCash';

/** Board index of a property, used in log messages. */
export const spaceOf = (id: string) => PROPERTY_POSITIONS[id];

const levels = (s: GameState, id: string) => groupIds(id).map((g) => buildingLevel(s.properties[g]));

/** Checks shared by house and hotel construction. */
function checkCanDevelop(s: GameState, player: Player, id: string): Check {
  const def = getPropertyDef(id);
  if (def.kind !== 'street') return 'notStreet';
  if (s.properties[id].ownerId !== player.id) return 'notOwner';
  if (!ownsFullGroup(s, player.id, id)) return 'needGroup';
  if (groupIds(id).some((g) => s.properties[g].mortgaged)) return 'mortgagedGroup';
  return 'ok';
}

export function checkBuildHouse(s: GameState, player: Player, id: string): Check {
  const base = checkCanDevelop(s, player, id);
  if (base !== 'ok') return base;
  const ps = s.properties[id];
  if (ps.hotel) return 'hasHotel';
  if (ps.houses >= 4) return 'maxHouses';
  // Even building: never more than one house ahead of the rest of the group.
  if (ps.houses > Math.min(...levels(s, id))) return 'uneven';
  if (housesLeft(s) === 0) return 'noHousesLeft';
  if (player.cash < getPropertyDef(id).houseCost) return 'noCash';
  return 'ok';
}

export function checkBuildHotel(s: GameState, player: Player, id: string): Check {
  const base = checkCanDevelop(s, player, id);
  if (base !== 'ok') return base;
  const ps = s.properties[id];
  if (ps.hotel) return 'hasHotel';
  if (ps.houses < 4) return 'needFourHouses';
  if (Math.min(...levels(s, id)) < 4) return 'uneven';
  if (hotelsLeft(s) === 0) return 'noHotelsLeft';
  if (player.cash < getPropertyDef(id).houseCost) return 'noCash';
  return 'ok';
}

export function checkSellBuilding(s: GameState, player: Player, id: string): Check {
  const ps = s.properties[id];
  if (ps.ownerId !== player.id) return 'notOwner';
  const level = buildingLevel(ps);
  if (level === 0) return 'noBuildings';
  // Even selling: sell from the most developed property first.
  if (level < Math.max(...levels(s, id))) return 'uneven';
  return 'ok';
}

/** Buildings sell back to the bank for half their cost. */
export function buildingSellValue(id: string): number {
  return Math.floor(getPropertyDef(id).houseCost / 2);
}

export function buildHouse(s: GameState, player: Player, id: string): boolean {
  if (checkBuildHouse(s, player, id) !== 'ok') return false;
  const cost = getPropertyDef(id).houseCost;
  player.cash -= cost;
  bankReceive(s, cost);
  s.properties[id].houses += 1;
  addStat(s, player.id, 'housesBuilt');
  addLog(s, 'builtHouse', { player: player.name, space: spaceOf(id), amount: cost });
  return true;
}

export function buildHotel(s: GameState, player: Player, id: string): boolean {
  if (checkBuildHotel(s, player, id) !== 'ok') return false;
  const cost = getPropertyDef(id).houseCost;
  player.cash -= cost;
  bankReceive(s, cost);
  // The hotel replaces the 4 houses, which go back to the bank.
  s.properties[id].houses = 0;
  s.properties[id].hotel = true;
  addStat(s, player.id, 'hotelsBuilt');
  addLog(s, 'builtHotel', { player: player.name, space: spaceOf(id), amount: cost });
  return true;
}

export function sellBuilding(s: GameState, player: Player, id: string): boolean {
  if (checkSellBuilding(s, player, id) !== 'ok') return false;
  const ps = s.properties[id];
  let levelsSold = 1;
  if (ps.hotel) {
    // A hotel breaks back down into 4 houses, but only as many as the bank still has.
    ps.hotel = false;
    ps.houses = Math.min(4, housesLeft(s) ?? 4);
    levelsSold = 5 - ps.houses;
  } else {
    ps.houses -= 1;
  }
  const value = buildingSellValue(id) * levelsSold;
  player.cash += value;
  bankPay(s, value);
  addLog(s, 'soldBuilding', { player: player.name, space: spaceOf(id), amount: value });
  return true;
}
