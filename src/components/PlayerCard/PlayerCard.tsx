import { useEffect, useRef, useState } from 'react';
import { BOARD } from '../../data/board';
import { useGameStore, useT } from '../../store/gameStore';
import type { Player } from '../../types/game';
import { formatMoney } from '../../utils/currency';

/** Shows a small floating "+৳X / -৳X" whenever the player's cash changes. */
function useCashDelta(cash: number) {
  const prev = useRef(cash);
  const [delta, setDelta] = useState<{ amount: number; key: number } | null>(null);
  useEffect(() => {
    const diff = cash - prev.current;
    prev.current = cash;
    if (diff === 0) return;
    setDelta({ amount: diff, key: Date.now() });
    const timer = setTimeout(() => setDelta(null), 1600);
    return () => clearTimeout(timer);
  }, [cash]);
  return delta;
}

/** True for a moment right after the player goes bankrupt. */
function useJustBankrupt(bankrupt: boolean) {
  const prev = useRef(bankrupt);
  const [shaking, setShaking] = useState(false);
  useEffect(() => {
    const became = bankrupt && !prev.current;
    prev.current = bankrupt;
    if (!became) return;
    setShaking(true);
    const timer = setTimeout(() => setShaking(false), 700);
    return () => clearTimeout(timer);
  }, [bankrupt]);
  return shaking;
}

export function PlayerCard({ player, isCurrent, debt = 0, worth, isMe = false, offline = false, onRemove }: {
  player: Player;
  isCurrent: boolean;
  debt?: number;
  worth: number;
  /** Online: this card is the viewer's own player. */
  isMe?: boolean;
  /** Online: the player's connection dropped. */
  offline?: boolean;
  /** Online, host only: shown once the player has been offline for a while. */
  onRemove?: () => void;
}) {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  const delta = useCashDelta(player.cash);
  const shaking = useJustBankrupt(player.bankrupt);
  const space = BOARD[player.position];

  return (
    <div
      data-player-card={player.id}
      className={`relative rounded-xl border-2 bg-white p-3 shadow-sm transition duration-700
        ${isCurrent ? 'scale-[1.02] shadow-lg' : 'border-transparent'}
        ${shaking ? 'animate-shake border-rose-500' : ''}
        ${player.bankrupt && !shaking ? 'opacity-50 grayscale' : ''}`}
      style={isCurrent ? { borderColor: player.color } : undefined}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xl"
          style={{ borderColor: player.color, background: `${player.color}22` }}
        >
          {player.token}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold" style={{ color: player.color }}>{player.name}</div>
          <div className="text-lg font-semibold tabular-nums text-stone-800">{formatMoney(player.cash)}</div>
        </div>
        {delta && (
          <span
            key={delta.key}
            className={`animate-float absolute right-3 top-2 text-sm font-bold ${delta.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}
          >
            {delta.amount > 0 ? '+' : ''}{formatMoney(delta.amount)}
          </span>
        )}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-2 text-xs text-stone-600">
        <span>{t('properties')}: <b>{player.properties.length}</b></span>
        <span className="col-span-2 order-last">{t('netWorth')}: <b className="tabular-nums">{formatMoney(worth)}</b></span>
        <span className="truncate">📍 {lang === 'bn' ? space.nameBn : space.nameEn}</span>
        {player.getOutOfJailCards > 0 && <span>🎟️ {t('jailCards')}: {player.getOutOfJailCards}</span>}
      </div>
      <div className="mt-1 flex flex-wrap gap-1 text-xs">
        {player.inJail && <span className="rounded bg-stone-800 px-1.5 py-0.5 text-white">🔒 {t('inJail')} ({player.jailTurns}/3)</span>}
        {debt > 0 && <span className="animate-pulse rounded bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-700">⚠️ {t('debt')}: {formatMoney(debt)}</span>}
        {player.bankrupt && <span className="rounded bg-rose-700 px-1.5 py-0.5 text-white">{t('bankrupt')}</span>}
        {isMe && <span className="rounded bg-emerald-700 px-1.5 py-0.5 font-semibold text-white">{t('you')}</span>}
        {offline && <span className="rounded bg-stone-200 px-1.5 py-0.5 text-stone-600">📴 {t('offline')}</span>}
        {onRemove && (
          <button type="button" onClick={onRemove} className="rounded px-1.5 py-0.5 text-rose-700 ring-1 ring-rose-300 hover:bg-rose-50">
            {t('removePlayer')}
          </button>
        )}
        {isCurrent && !player.bankrupt && <span className="rounded bg-amber-300 px-1.5 py-0.5">{t('currentTurn')}</span>}
      </div>
    </div>
  );
}
