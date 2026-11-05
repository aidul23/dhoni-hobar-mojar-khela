import { useEffect, useRef } from 'react';
import type { LogEntry } from '../types/game';

/**
 * Calls `onNew` with log entries added since the last call, but only while not
 * `paused` (e.g. while tokens are still walking), so effects line up with the board.
 * Entries that existed when the component mounted are ignored.
 */
export function useLogEvents(log: LogEntry[], paused: boolean, onNew: (entries: LogEntry[]) => void) {
  const lastId = useRef(log.at(-1)?.id ?? 0);
  const callback = useRef(onNew);
  callback.current = onNew;

  useEffect(() => {
    if (paused) return;
    const fresh = log.filter((e) => e.id > lastId.current);
    if (fresh.length === 0) return;
    lastId.current = fresh[fresh.length - 1].id;
    callback.current(fresh);
  }, [log, paused]);
}
