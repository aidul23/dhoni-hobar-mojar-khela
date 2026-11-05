import { JAIL_INDEX } from '../data/board';
import type { GameState, Player } from '../types/game';
import { chargePlayer } from './bankruptcy';
import { addLog, currentPlayer } from './state';
import { addStat } from './stats';

export const MAX_JAIL_TURNS = 3;

export function sendToJail(s: GameState, player: Player): void {
  player.position = JAIL_INDEX;
  player.inJail = true;
  player.jailTurns = 0;
  addStat(s, player.id, 'jailVisits');
  if (currentPlayer(s).id === player.id) {
    s.canRollAgain = false;
    s.doublesCount = 0;
  }
  addLog(s, 'wentToJail', { player: player.name }, true);
}

export function releaseFromJail(player: Player): void {
  player.inJail = false;
  player.jailTurns = 0;
}

/** Voluntary fine payment before rolling. Returns false if not allowed. */
export function payJailFine(s: GameState, player: Player): boolean {
  if (!player.inJail || player.cash < s.settings.jailFine) return false;
  chargePlayer(s, player, s.settings.jailFine, null);
  releaseFromJail(player);
  addLog(s, 'jailPaidFine', { player: player.name, amount: s.settings.jailFine });
  return true;
}

export function useJailCard(s: GameState, player: Player): boolean {
  if (!player.inJail || player.getOutOfJailCards <= 0) return false;
  player.getOutOfJailCards -= 1;
  releaseFromJail(player);
  addLog(s, 'jailUsedCard', { player: player.name });
  return true;
}
