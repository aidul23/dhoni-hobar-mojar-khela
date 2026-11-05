import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import type { LogEntry } from '../../types/game';
import { formatLog } from '../../utils/translations';

/** Briefly shows important events (rent, tax, jail...). Waits while `paused`. */
export function Toast({ notice, paused }: { notice: LogEntry | null; paused: boolean }) {
  const lang = useGameStore((s) => s.lang);
  const lastShown = useRef(notice?.id ?? 0);
  const [visible, setVisible] = useState<LogEntry | null>(null);

  useEffect(() => {
    if (paused || !notice || notice.id === lastShown.current) return;
    lastShown.current = notice.id;
    setVisible(notice);
  }, [notice, paused]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(null), 3500);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div key={visible.id} className="animate-slide-down rounded-xl bg-stone-900/90 px-5 py-3 text-center font-semibold text-white shadow-xl">
        {formatLog(lang, visible)}
      </div>
    </div>
  );
}
