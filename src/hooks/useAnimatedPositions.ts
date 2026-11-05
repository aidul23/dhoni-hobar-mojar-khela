import { useEffect, useState } from 'react';
import { BOARD_SIZE } from '../data/board';
import type { Player } from '../types/game';

const STEP_MS = 160;
/** Moves longer than this (e.g. jail, moving backwards) jump instead of walking. */
const MAX_WALK = 12;

/**
 * Returns token positions that walk space-by-space toward the real positions,
 * plus a flag telling whether any token is still moving. While `paused`
 * (e.g. dice still spinning) tokens wait in place.
 */
export function useAnimatedPositions(players: Player[], paused = false) {
  const [shown, setShown] = useState<Record<string, number>>(() =>
    Object.fromEntries(players.map((p) => [p.id, p.position])),
  );

  const target = players.map((p) => `${p.id}:${p.position}`).join('|');
  const moving = players.some((p) => shown[p.id] !== p.position);

  useEffect(() => {
    if (!moving || paused) return;
    const timer = setTimeout(() => {
      setShown((prev) => {
        const next = { ...prev };
        for (const p of players) {
          const cur = prev[p.id];
          if (cur === undefined || cur === p.position) {
            next[p.id] = p.position;
            continue;
          }
          const dist = (p.position - cur + BOARD_SIZE) % BOARD_SIZE;
          next[p.id] = dist > MAX_WALK ? p.position : (cur + 1) % BOARD_SIZE;
        }
        return next;
      });
    }, STEP_MS);
    return () => clearTimeout(timer);
    // `target` captures every position change; `shown` drives each step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, shown, moving, paused]);

  return { positions: shown, moving };
}
