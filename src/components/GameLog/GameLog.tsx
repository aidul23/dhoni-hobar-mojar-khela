import { useGameStore, useT } from '../../store/gameStore';
import type { LogEntry } from '../../types/game';
import { formatLog } from '../../utils/translations';

export function GameLog({ log }: { log: LogEntry[] }) {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  const entries = [...log].reverse();

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-xl bg-white p-3 shadow-sm">
      <h3 className="mb-2 font-bold text-emerald-800">{t('gameLog')}</h3>
      <ol className="min-h-32 flex-1 space-y-1 overflow-y-auto pr-1 text-sm text-stone-700">
        {entries.map((e) => (
          <li key={e.id} className="border-b border-stone-100 pb-1 last:border-0">{formatLog(lang, e)}</li>
        ))}
      </ol>
    </section>
  );
}
