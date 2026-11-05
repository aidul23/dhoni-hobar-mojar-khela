import type { GameState, Player } from '../types/game';
import { bankPay, bankReceive } from './bank';
import { spaceOf } from './building';
import { getMortgageValue, getUnmortgageCost, groupHasBuildings } from './property';
import { addLog } from './state';

export type MortgageCheck = 'ok' | 'notOwner' | 'alreadyMortgaged' | 'notMortgaged' | 'hasBuildings' | 'noCash';

export function checkMortgage(s: GameState, player: Player, id: string): MortgageCheck {
  const ps = s.properties[id];
  if (ps.ownerId !== player.id) return 'notOwner';
  if (ps.mortgaged) return 'alreadyMortgaged';
  if (groupHasBuildings(s, id)) return 'hasBuildings';
  return 'ok';
}

export function checkUnmortgage(s: GameState, player: Player, id: string): MortgageCheck {
  const ps = s.properties[id];
  if (ps.ownerId !== player.id) return 'notOwner';
  if (!ps.mortgaged) return 'notMortgaged';
  if (player.cash < getUnmortgageCost(s.settings, id)) return 'noCash';
  return 'ok';
}

export function mortgageProperty(s: GameState, player: Player, id: string): boolean {
  if (checkMortgage(s, player, id) !== 'ok') return false;
  const value = getMortgageValue(s.settings, id);
  s.properties[id].mortgaged = true;
  player.cash += value;
  bankPay(s, value);
  addLog(s, 'logMortgaged', { player: player.name, space: spaceOf(id), amount: value });
  return true;
}

export function unmortgageProperty(s: GameState, player: Player, id: string): boolean {
  if (checkUnmortgage(s, player, id) !== 'ok') return false;
  const cost = getUnmortgageCost(s.settings, id);
  s.properties[id].mortgaged = false;
  player.cash -= cost;
  bankReceive(s, cost);
  addLog(s, 'logUnmortgaged', { player: player.name, space: spaceOf(id), amount: cost });
  return true;
}
