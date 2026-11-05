import { BOARD, BOARD_SIZE } from '../data/board';
import type { GameState, Player } from '../types/game';
import { addLog } from './state';
import { bankPay } from './bank';
import { addStat } from './stats';

export function wrapPosition(pos: number): number {
  return ((pos % BOARD_SIZE) + BOARD_SIZE) % BOARD_SIZE;
}

/** Forward distance from `from` to `to` (0..39). */
export function stepsForward(from: number, to: number): number {
  return wrapPosition(to - from);
}

/**
 * Moves a player by `steps` (negative = backwards).
 * Moving forward past or onto Start pays the start bonus.
 */
export function movePlayerBy(s: GameState, player: Player, steps: number): void {
  const raw = player.position + steps;
  player.position = wrapPosition(raw);
  if (steps > 0 && raw >= BOARD_SIZE) {
    player.cash += s.settings.startBonus;
    bankPay(s, s.settings.startBonus);
    addStat(s, player.id, 'passedStart');
    addLog(s, 'passedStart', { player: player.name, amount: s.settings.startBonus });
  }
  addLog(s, 'landed', { player: player.name, space: player.position });
}

/** Advances forward to a specific space (collecting the start bonus if passed). */
export function advanceTo(s: GameState, player: Player, target: number): void {
  movePlayerBy(s, player, stepsForward(player.position, target));
}

/** Finds the next space forward matching the predicate. */
export function nextSpaceWhere(from: number, predicate: (index: number) => boolean): number {
  for (let i = 1; i <= BOARD_SIZE; i++) {
    const idx = wrapPosition(from + i);
    if (predicate(idx)) return idx;
  }
  return from;
}

export function spaceAt(index: number) {
  return BOARD[wrapPosition(index)];
}
