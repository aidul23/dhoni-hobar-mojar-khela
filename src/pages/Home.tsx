import { formatNumber } from '../utils/currency';
import { Clock, Dices, Globe, Play, Smartphone } from 'lucide-react';
import { ONLINE_ENABLED } from '../config';
import { IconText } from '../components/IconText';
import { useState } from 'react';
import { DEFAULT_RULES, RulesEditor } from '../components/Setup/SetupParts';
import { DemoBoard } from '../components/Home/DemoBoard';
import { HowToPlay } from '../components/Home/HowToPlay';
import { AddPlayerCard, PlayerTicket } from '../components/Home/PlayerTicket';
import { PLAYER_COLORS, TOKENS } from '../data/tokens';
import { buildSettings, MAX_PLAYERS, MIN_PLAYERS } from '../engine/setup';
import { FlyingTaka } from '../components/Home/FlyingTaka';
import { RickshawSignboard } from '../components/Home/RickshawSignboard';
import { useGameStore, useT } from '../store/gameStore';
import { useOnlineStore } from '../store/onlineStore';
import type { PlayerSetup } from '../types/game';

export function Home() {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
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
  const [showComingSoon, setShowComingSoon] = useState(false);

  // Online play needs the game server; until it is deployed the button explains that.
  const handleOnline = () => {
    if (ONLINE_ENABLED) return openOnline();
    setShowComingSoon(true);
    window.setTimeout(() => setShowComingSoon(false), 3500);
  };

  const active = players.slice(0, count);
  const unique = (key: 'color' | 'token') => new Set(active.map((p) => p[key])).size === active.length;
  const valid = unique('color') && unique('token');

  const update = (i: number, patch: Partial<PlayerSetup>) =>
    setPlayers((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  // Removing a player moves their slot to the end, so the remaining players keep their picks.
  const remove = (i: number) => {
    setPlayers((prev) => [...prev.slice(0, i), ...prev.slice(i + 1), prev[i]]);
    setCount((c) => c - 1);
  };

  const start = () => {
    if (!valid) return;
    startGame(active, buildSettings(rules.mode, rules.startingCash, rules.custom));
  };

  return (
    <div className="mx-auto max-w-6xl space-y-12 p-4 pb-16">
      <div className="rickshaw-bg fixed inset-0 -z-10" aria-hidden />
      <FlyingTaka />

      {/* Hero: signboard and buttons beside a board that plays itself. */}
      <header className="grid items-center gap-8 pt-4 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
        <div className="text-center">
          <RickshawSignboard />
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {hasSave && (
              <button
                type="button"
                onClick={continueGame}
                className="rounded-xl border-2 border-[#7c2d12] bg-amber-400 px-6 py-3 text-lg font-bold text-[#422006] shadow-[3px_3px_0_#7c2d12] transition hover:-translate-y-0.5 hover:bg-amber-300"
              >
                <IconText icon={Play} iconClassName="h-5 w-5 fill-current">{t('continueGame')}</IconText>
              </button>
            )}
            <button
              type="button"
              onClick={handleOnline}
              aria-describedby={ONLINE_ENABLED ? undefined : 'online-soon'}
              className={`relative rounded-xl border-2 border-[#1e3a8a] px-6 py-3 text-lg font-bold text-white shadow-[3px_3px_0_#1e3a8a] transition hover:-translate-y-0.5 ${ONLINE_ENABLED
                ? 'bg-blue-700 hover:bg-blue-600'
                : 'bg-blue-700/70 hover:bg-blue-700/80'}`}
            >
              <IconText icon={Globe}>{t('playOnline')}</IconText>
              {!ONLINE_ENABLED && (
                <span className="absolute -right-2 -top-3 rotate-6 rounded-full border-2 border-white bg-[#be123c] px-2 py-0.5 text-xs font-bold text-white shadow">
                  {t('comingSoon')}
                </span>
              )}
            </button>
          </div>
          {showComingSoon && (
            <p id="online-soon" role="status" className="animate-pop mx-auto mt-4 flex w-fit max-w-full items-center gap-2 rounded-xl border-2 border-[#7c2d12] bg-[#facc15] px-4 py-2 font-semibold text-[#7c2d12] shadow-[3px_3px_0_#7c2d12]">
              <Clock className="h-5 w-5 shrink-0" aria-hidden />
              {t('onlineComingSoon')}
            </p>
          )}
        </div>
        <div className="mx-auto w-full max-w-md lg:max-w-none">
          <DemoBoard lang={lang} playerLabel={t('player')} />
        </div>
      </header>

      <HowToPlay />

      {/* Local game setup, styled as a lobby. */}
      <section aria-labelledby="play-here" className="space-y-5">
        <h2 id="play-here" className="text-center">
          <span className="inline-flex -rotate-1 items-center gap-2 rounded-lg border-2 border-[#134e4a] bg-[#0f766e] px-5 py-1 text-xl font-bold text-white shadow-[3px_3px_0_#134e4a]">
            <Smartphone className="h-5 w-5" aria-hidden />{t('playOnDevice')}
          </span>
        </h2>
        <p className="text-center text-lg font-bold text-stone-700">{t('whoIsPlaying')}</p>

        <div className="flex flex-wrap justify-center gap-5 [&>*]:w-full sm:[&>*]:w-[calc(50%-0.7rem)] xl:[&>*]:w-[calc(25%-0.95rem)]">
          {active.map((p, i) => (
            <PlayerTicket
              key={i}
              player={p}
              title={`${t('player')} ${formatNumber(i + 1)}`}
              onChange={(patch) => update(i, patch)}
              onRemove={count > MIN_PLAYERS ? () => remove(i) : undefined}
            />
          ))}
          {count < MAX_PLAYERS && <AddPlayerCard onClick={() => setCount((c) => c + 1)} />}
        </div>

        <div className={`mx-auto grid max-w-4xl gap-4 ${rules.mode === 'custom' ? '' : 'sm:grid-cols-2'}`}>
          <RulesEditor rules={rules} onChange={setRules} />
        </div>

        {!valid && <p className="text-center font-semibold text-rose-600">{t('duplicateColors')}</p>}
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={start}
            disabled={!valid}
            className={`rickshaw-frame rounded-2xl p-[5px] shadow-[0_6px_0_#7f1d1d,0_12px_24px_rgba(0,0,0,0.2)] transition disabled:opacity-50 ${valid ? 'start-bounce hover:scale-105' : ''}`}
          >
            <span className="flex items-center gap-3 rounded-xl border-[3px] border-white bg-gradient-to-b from-[#0f766e] to-[#134e4a] px-10 py-4">
              <Dices className="h-8 w-8 text-yellow-300" aria-hidden />
              <span className="rickshaw-title rickshaw-title-small text-3xl">{t('startGame')}</span>
            </span>
          </button>
        </div>
      </section>
    </div>
  );
}
