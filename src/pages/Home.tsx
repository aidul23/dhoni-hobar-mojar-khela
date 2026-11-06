import { formatNumber } from '../utils/currency';
import { Dices, Globe, Play, Smartphone } from 'lucide-react';
import { IconText } from '../components/IconText';
import { useState } from 'react';
import { Button } from '../components/Modal/Button';
import { Choice, DEFAULT_RULES, PlayerFields, RulesEditor, Section } from '../components/Setup/SetupParts';
import { PLAYER_COLORS, TOKENS } from '../data/tokens';
import { buildSettings, MAX_PLAYERS, MIN_PLAYERS } from '../engine/setup';
import { FlyingTaka } from '../components/Home/FlyingTaka';
import { RickshawSignboard } from '../components/Home/RickshawSignboard';
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
      name: `${t('player')} ${formatNumber(i + 1)}`,
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
      <div className="rickshaw-bg fixed inset-0 -z-10" aria-hidden />
      <FlyingTaka />
      <header className="py-6 text-center">
        <RickshawSignboard />
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {hasSave && (
            <button
              type="button"
              onClick={continueGame}
              className="rounded-xl bg-amber-400 px-6 py-3 text-lg font-bold shadow hover:bg-amber-500"
            >
              <IconText icon={Play} iconClassName="h-5 w-5 fill-current">{t('continueGame')}</IconText>
            </button>
          )}
          <button
            type="button"
            onClick={() => openOnline()}
            className="rounded-xl bg-blue-700 px-6 py-3 text-lg font-bold text-white shadow hover:bg-blue-800"
          >
            <IconText icon={Globe}>{t('playOnline')}</IconText>
          </button>
        </div>
      </header>

      <h2 className="flex items-center justify-center gap-2 text-lg font-bold text-stone-700"><Smartphone className="h-5 w-5" aria-hidden />{t('playOnDevice')}</h2>

      <Section title={t('numPlayers')}>
        <div className="flex gap-2">
          {Array.from({ length: MAX_PLAYERS - MIN_PLAYERS + 1 }, (_, i) => i + MIN_PLAYERS).map((n) => (
            <Choice key={n} active={count === n} onClick={() => setCount(n)}>{formatNumber(n)}</Choice>
          ))}
        </div>
      </Section>

      <div className="grid gap-4 sm:grid-cols-2">
        {active.map((p, i) => (
          <Section key={i} title={`${t('player')} ${formatNumber(i + 1)}`}>
            <PlayerFields player={p} onChange={(patch) => update(i, patch)} />
          </Section>
        ))}
      </div>

      <RulesEditor rules={rules} onChange={setRules} />

      {!valid && <p className="text-center font-semibold text-rose-600">{t('duplicateColors')}</p>}
      <Button onClick={start} disabled={!valid} className="w-full py-3 text-xl">
        <Dices className="h-6 w-6" aria-hidden /> {t('startGame')}
      </Button>
    </div>
  );
}
