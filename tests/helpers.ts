import { gameReducer } from '../src/engine/game';
import { buildSettings, createGame } from '../src/engine/setup';
import type { GameAction, GameState } from '../src/types/game';

const COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7'];

export function newGame(players = 2, mode: 'classic' | 'fast' = 'classic'): GameState {
  const setups = Array.from({ length: players }, (_, i) => ({
    name: `P${i + 1}`, color: COLORS[i], token: String(i),
  }));
  return createGame(setups, buildSettings(mode, 15000), () => 0.5);
}

export function run(s: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, s);
}

export const roll = (a: number, b: number): GameAction => ({ type: 'ROLL', dice: [a, b] });

/** Gives ownership directly (test setup helper). */
export function own(s: GameState, playerIdx: number, ...ids: string[]): GameState {
  const next = structuredClone(s);
  for (const id of ids) {
    next.properties[id].ownerId = next.players[playerIdx].id;
    next.players[playerIdx].properties.push(id);
  }
  return next;
}

export function patch(s: GameState, fn: (draft: GameState) => void): GameState {
  const next = structuredClone(s);
  fn(next);
  return next;
}
