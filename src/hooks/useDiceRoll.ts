import { useEffect, useRef, useState } from 'react';
import { rollDice } from '../engine/dice';
import type { LogEntry } from '../types/game';

const ROLL_MS = 700;

/**
 * Spins the dice whenever a new "rolled" event appears in the log, then shows
 * the real result. Because it reacts to game state rather than to a button,
 * every player in an online room sees the same roll.
 */
export function useDiceAnimation(log: LogEntry[], onSpinStart?: () => void) {
  const lastRoll = [...log].reverse().find((e) => e.key === 'rolled');
  const seen = useRef(lastRoll?.id ?? 0);
  const [rolling, setRolling] = useState(false);
  const [faces, setFaces] = useState<[number, number]>([1, 1]);
  const startCallback = useRef(onSpinStart);
  startCallback.current = onSpinStart;

  useEffect(() => {
    if (!lastRoll || lastRoll.id === seen.current) return;
    seen.current = lastRoll.id;
    setRolling(true);
    startCallback.current?.();
  }, [lastRoll]);

  useEffect(() => {
    if (!rolling) return;
    const spin = setInterval(() => setFaces(rollDice()), 80);
    const done = setTimeout(() => setRolling(false), ROLL_MS);
    return () => {
      clearInterval(spin);
      clearTimeout(done);
    };
  }, [rolling]);

  return { rolling, faces };
}
