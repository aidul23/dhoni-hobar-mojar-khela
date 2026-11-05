import { useState } from 'react';
import { Button } from '../components/Modal/Button';
import { Choice, DEFAULT_RULES, PlayerFields, RulesEditor, Section } from '../components/Setup/SetupParts';
import { PLAYER_COLORS, TOKENS } from '../data/tokens';
import { buildSettings, MAX_PLAYERS, MIN_PLAYERS } from '../engine/setup';
import { useGameStore, useT } from '../store/gameStore';
import { useOnlineStore } from '../store/onlineStore';
import type { PlayerSetup } from '../types/game';

export function Home() {
  const t = useT();
  const startGame = useGameStore((s) => s.startGame);
  const continueGame = useGameStore((s) => s.continueGame);
  const openOnline = useOnlineStore((s) => s.open);
  const hasSave = useGameStore((s) => s.hasSavedGame)();

  const [count, setCount] = useState(2);
  const [players, setPlayers] = useState<PlayerSetup[]>(() =>
    Array.from({ length: MAX_PLAYERS }, (_, i) => ({
      name: t('player') + ' ' + (i + 1),
      color: PLAYER_COLORS[i],
      token: TOKENS[i],
    })),
  );
  const [rules, setRules] = useState(DEFAULT_RULES);

  const active = players.slice(0, count);
  const unique = (key: 'color' | 'token') => new Set(active.map((p) => p[key])).size === active.length;
  const valid = unique('color') && unique('token');

  const update = (i: number, patch: Partial<PlayerSetup>) =>
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const start = () => {
    if (!valid) return;
    startGame(active, buildSettings(rules.mode, rules.startingCash, rules.custom));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 pb-12">
      <header className="py-6 text-center">
        <div className="text-5xl">🏘️💰🎲</div>
        <h1 className="mt-3 text-4xl font-bold text-emerald-800 sm:text-5xl">{t('title')}</h1>
        <p className="mt-2 text-stone-600">{t('subtitle')}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {hasSave && (
            <button
              type="button"
              onClick={continueGame}
              className="rounded-xl bg-amber-400 px-6 py-3 text-lg font-bold shadow hover:bg-amber-500"
            >
              ▶ {t('continueGame')}
            </button>
          )}
          <button
            type="button"
            onClick={() => openOnline()}
            className="rounded-xl bg-blue-700 px-6 py-3 text-lg font-bold text-white shadow hover:bg-blue-800"
          >
            🌐 {t('playOnline')}
          </button>
        </div>
      </header>

      <h2 className="text-center text-lg font-bold text-stone-700">📱 {t('playOnDevice')}</h2>

      <Section title={t('numPlayers')}>
        <div className="flex gap-2">
          {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => i + MIN_PLAYERS).map((n) => (
            <Choice key={n} active={count === n} onClick={() => setCount(n)}>{n}</Choice>
          ))}
        </div>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        {active.map((p, i) => (
          <Section key={i} title={`${t('player')} ${i + 1}`}>
            <PlayerFields player={p} onChange={(patch) => update(i, patch)} />
          </Section>
        ))}
      </div>

      <RulesEditor rules={rules} onChange={setRules} />

      {!valid && <p className="text-center font-semibold text-rose-600">{t('duplicateColors')}</p>}
      <Button onClick={start} disabled={!valid} className="w-full py-3 text-xl">
        {t('startGame')} 🎲
      </Button>
    </div>
  );
}
