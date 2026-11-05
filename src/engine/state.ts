import type { GameState, LogParams, Player } from '../types/game';

/**
 * Engine convention: functions in this folder that take a `GameState` named `s`
 * MUTATE it. They are only ever called on a fresh clone made by `gameReducer`,
 * so the reducer as a whole stays pure.
 */

const MAX_LOG = 200;

export function currentPlayer(s: GameState): Player {
  return s.players[s.currentPlayerIndex];
}

export function getPlayer(s: GameState, id: string): Player {
  const p = s.players.find((pl) => pl.id === id);
  if (!p) throw new Error(`Unknown player ${id}`);
  return p;
}

/**
 * The player allowed to manage assets right now: the first debtor while a debt
 * is open, otherwise the player whose turn it is.
 */
export function actingPlayer(s: GameState): Player {
  return s.debts.length > 0 ? getPlayer(s, s.debts[0].debtorId) : currentPlayer(s);
}

export function activePlayers(s: GameState): Player[] {
  return s.players.filter((p) => !p.bankrupt);
}

export function addLog(s: GameState, key: string, params: LogParams = {}, asNotice = false): void {
  const entry = { id: s.nextLogId++, key, params };
  s.log.push(entry);
  if (s.log.length > MAX_LOG) s.log.splice(0, s.log.length - MAX_LOG);
  if (asNotice) s.notice = entry;
}
