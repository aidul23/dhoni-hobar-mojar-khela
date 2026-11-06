import { formatNumber } from '../../utils/currency';
import { Hotel, House, Landmark } from 'lucide-react';
import { PeacockFeather } from '../Decor/PeacockFeather';
import { hotelsLeft, housesLeft } from '../../engine/bank';
import type { GameState, Lang } from '../../types/game';
import { t, formatLog } from '../../utils/translations';
import { Flower } from '../Decor/Flower';
import { Dice } from '../Dice/Dice';

interface Props {
  game: GameState;
  lang: Lang;
  faces: [number, number];
  rolling: boolean;
}

/** The game title as a small painted signboard. */
function CenterSignboard({ title }: { title: string }) {
  return (
    <div className="rickshaw-frame -rotate-2 rounded-[1.6cqw] p-[0.6cqw] shadow-[0_0.6cqw_0_#7f1d1d]">
      <div className="flex items-center gap-[1cqw] rounded-[1.1cqw] border-[0.35cqw] border-white bg-gradient-to-b from-[#0f766e] to-[#134e4a] px-[2.4cqw] py-[0.9cqw]">
        <PeacockFeather className="h-[4.4cqw] w-[2.8cqw] -rotate-12" />
        <span className="rickshaw-title rickshaw-title-small text-[4.6cqw]">{title}</span>
        <PeacockFeather className="h-[4.4cqw] w-[2.8cqw] rotate-12" />
      </div>
    </div>
  );
}

const fmtLeft = (n: number | null) => (n === null ? '∞' : formatNumber(n));

export function BoardCenter({ game, lang, faces, rolling }: Props) {
  const player = game.players[game.currentPlayerIndex];
  const recent = game.log.slice(-4).reverse();

  return (
    <div
      className="rickshaw-bg relative flex flex-col items-center justify-center gap-[1.5cqw] p-[3cqw]"
      style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}
    >
      <Flower className="absolute left-[1.2cqw] top-[1.2cqw] h-[6cqw] w-[6cqw]" />
      <Flower className="absolute right-[1.2cqw] top-[1.2cqw] h-[6cqw] w-[6cqw]" petal="#f59e0b" center="#e11d48" />
      <Flower className="absolute bottom-[1.2cqw] left-[1.2cqw] h-[5cqw] w-[5cqw]" petal="#db2777" />
      <Flower className="absolute bottom-[1.2cqw] right-[1.2cqw] h-[5cqw] w-[5cqw]" petal="#2563eb" />
      <CenterSignboard title={t(lang, 'title')} />

      <div className="flex items-center gap-[1cqw] rounded-full bg-white/80 px-[2cqw] py-[0.6cqw] text-[1.9cqw] shadow">
        <span className="h-[1.6cqw] w-[1.6cqw] rounded-full" style={{ background: player.color }} />
        <span>{player.token}</span>
        <span className="font-semibold">{t(lang, 'boardTurn', { player: player.name })}</span>
        <span className="text-stone-500">
          · {game.settings.turnLimit
            ? t(lang, 'roundOf', { n: Math.min(game.round, game.settings.turnLimit), max: game.settings.turnLimit })
            : t(lang, 'round', { n: game.round })}
        </span>
      </div>

      <Dice faces={faces} rolling={rolling} size="7cqw" />

      {(game.settings.houseLimit || game.settings.hotelLimit) && (
        <div className="rounded-full bg-white/80 px-[1.6cqw] py-[0.4cqw] text-[1.5cqw] text-stone-700 shadow-sm" title={t(lang, 'bankLabel')}>
          <span className="flex items-center gap-[0.6cqw]">
            <Landmark className="h-[1.7cqw] w-[1.7cqw] text-blue-900" aria-hidden />
            <House className="h-[1.6cqw] w-[1.6cqw] text-emerald-700" aria-hidden /> {fmtLeft(housesLeft(game))}
            <span className="text-stone-400">·</span>
            <Hotel className="h-[1.6cqw] w-[1.6cqw] text-rose-700" aria-hidden /> {fmtLeft(hotelsLeft(game))}
          </span>
        </div>
      )}

      <div className="w-[70%] rounded-xl bg-white/70 p-[1.5cqw] shadow-inner">
        <div className="mb-[0.5cqw] text-[1.5cqw] font-bold text-emerald-800">{t(lang, 'recentEvents')}</div>
        <ul className="space-y-[0.3cqw] text-[1.45cqw] text-stone-700">
          {recent.map((e, i) => (
            <li key={e.id} className={i === 0 ? 'font-semibold text-stone-900' : ''}>
              {formatLog(lang, e)}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
