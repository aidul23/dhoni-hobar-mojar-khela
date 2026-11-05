import { useState, type ReactNode } from 'react';
import { PLAYER_COLORS, TOKENS } from '../../data/tokens';
import { DEFAULT_SETTINGS, LIMITS } from '../../engine/setup';
import type { RoomRules } from '../../net/protocol';
import { useT } from '../../store/gameStore';
import type { GameMode, PlayerSetup } from '../../types/game';
import { formatMoney } from '../../utils/currency';

const CASH_OPTIONS = [10000, 15000, 20000];
const MODES: GameMode[] = ['classic', 'fast', 'custom'];
const MODE_KEY: Record<GameMode, string> = { classic: 'modeClassic', fast: 'modeFast', custom: 'modeCustom' };

export const DEFAULT_RULES: Required<RoomRules> = {
  mode: 'classic',
  startingCash: DEFAULT_SETTINGS.startingCash,
  custom: {
    startBonus: DEFAULT_SETTINGS.startBonus,
    jailFine: DEFAULT_SETTINGS.jailFine,
    victoryPercent: 0,
    turnLimit: 0,
    houseLimit: DEFAULT_SETTINGS.houseLimit ?? 0,
    hotelLimit: DEFAULT_SETTINGS.hotelLimit ?? 0,
  },
};

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-bold text-emerald-800">{title}</h2>
      {children}
    </section>
  );
}

export function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-4 py-2 font-semibold ring-1 transition ${active ? 'bg-emerald-700 text-white ring-emerald-700' : 'bg-white ring-stone-300 hover:bg-stone-50'}`}
    >
      {children}
    </button>
  );
}

/** Number input that allows free typing and clamps to [min, max] when focus leaves. */
export function NumberField({ label, value, onChange, min, max, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; min: number; max: number; step?: number;
}) {
  const [text, setText] = useState(String(value));
  const commit = () => {
    const n = Math.min(max, Math.max(min, Math.round(Number(text) || 0)));
    setText(String(n));
    onChange(n);
  };
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-stone-600">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        step={step}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        className="rounded-lg border border-stone-300 px-3 py-2"
      />
      <span className="text-xs text-stone-400">{min.toLocaleString('en-US')} – {max.toLocaleString('en-US')}</span>
    </label>
  );
}

/** Name, colour and token pickers for one player. Taken colours/tokens are disabled. */
export function PlayerFields({ player, onChange, taken }: {
  player: PlayerSetup;
  onChange: (patch: Partial<PlayerSetup>) => void;
  taken?: { colors: string[]; tokens: string[] };
}) {
  const t = useT();
  return (
    <>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-stone-600">{t('name')}</span>
        <input
          value={player.name}
          maxLength={16}
          onChange={(e) => onChange({ name: e.target.value })}
          className="rounded-lg border border-stone-300 px-3 py-2"
        />
      </label>
      <div className="mt-3 text-sm text-stone-600">{t('color')}</div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {PLAYER_COLORS.map((c) => {
          const used = taken?.colors.includes(c);
          return (
            <button
              key={c}
              type="button"
              aria-label={c}
              disabled={used}
              onClick={() => onChange({ color: c })}
              className={`h-7 w-7 rounded-full transition disabled:opacity-20 ${player.color === c ? 'ring-2 ring-stone-900 ring-offset-2' : ''}`}
              style={{ background: c }}
            />
          );
        })}
      </div>
      <div className="mt-3 text-sm text-stone-600">{t('token')}</div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {TOKENS.map((tok) => (
          <button
            key={tok}
            type="button"
            disabled={taken?.tokens.includes(tok)}
            onClick={() => onChange({ token: tok })}
            className={`flex h-9 w-9 items-center justify-center rounded-lg text-xl ring-1 disabled:opacity-20 ${player.token === tok ? 'bg-amber-100 ring-2 ring-amber-500' : 'ring-stone-200'}`}
          >
            {tok}
          </button>
        ))}
      </div>
    </>
  );
}

/** Game mode, starting cash and custom rule fields. */
export function RulesEditor({ rules, onChange }: { rules: Required<RoomRules>; onChange: (r: Required<RoomRules>) => void }) {
  const t = useT();
  const { mode, startingCash: cash, custom } = rules;
  const setCustom = (patch: Partial<typeof custom>) => onChange({ ...rules, custom: { ...custom, ...patch } });

  return (
    <>
      <Section title={t('gameMode')}>
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <Choice key={m} active={mode === m} onClick={() => onChange({ ...rules, mode: m })}>{t(MODE_KEY[m])}</Choice>
          ))}
        </div>
        <p className="mt-2 text-sm text-stone-500">{t(`${MODE_KEY[mode]}Desc`)}</p>
        {mode === 'custom' && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <NumberField label={t('startingCash')} value={cash} {...LIMITS.startingCash} step={1000} onChange={(v) => onChange({ ...rules, startingCash: v })} />
            <NumberField label={t('startBonus')} value={custom.startBonus} {...LIMITS.startBonus} step={100} onChange={(v) => setCustom({ startBonus: v })} />
            <NumberField label={t('jailFine')} value={custom.jailFine} {...LIMITS.jailFine} step={50} onChange={(v) => setCustom({ jailFine: v })} />
            <NumberField label={t('victoryPercent')} value={custom.victoryPercent ?? 0} {...LIMITS.victoryPercent} step={5} onChange={(v) => setCustom({ victoryPercent: v })} />
            <NumberField label={t('houseLimit')} value={custom.houseLimit ?? 0} {...LIMITS.houseLimit} step={4} onChange={(v) => setCustom({ houseLimit: v })} />
            <NumberField label={t('hotelLimit')} value={custom.hotelLimit ?? 0} {...LIMITS.hotelLimit} step={1} onChange={(v) => setCustom({ hotelLimit: v })} />
            <NumberField label={t('turnLimit')} value={custom.turnLimit ?? 0} {...LIMITS.turnLimit} step={5} onChange={(v) => setCustom({ turnLimit: v })} />
          </div>
        )}
      </Section>

      {mode !== 'custom' && (
        <Section title={t('startingCash')}>
          <div className="flex flex-wrap gap-2">
            {CASH_OPTIONS.map((c) => (
              <Choice key={c} active={cash === c} onClick={() => onChange({ ...rules, startingCash: c })}>{formatMoney(c)}</Choice>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
