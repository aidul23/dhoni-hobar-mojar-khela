import { hotelsLeft, housesLeft } from '../../engine/bank';
import type { GameState, Lang } from '../../types/game';
import { t, formatLog } from '../../utils/translations';
import { Dice } from '../Dice/Dice';

interface Props {
  game: GameState;
  lang: Lang;
  faces: [number, number];
  rolling: boolean;
}

export function BoardCenter({ game, lang, faces, rolling }: Props) {
  const player = game.players[game.currentPlayerIndex];
  const recent = game.log.slice(-4).reverse();

  return (
    <div
      className="flex flex-col items-center justify-center gap-[1.5cqw] bg-gradient-to-br from-emerald-50 to-amber-50 p-[3cqw]"
      style={{ gridRow: '2 / 11', gridColumn: '2 / 11' }}
    >
      <h1 className="-rotate-3 rounded-xl bg-emerald-700 px-[3cqw] py-[1cqw] text-[4.2cqw] font-bold text-amber-200 shadow-lg">
        {t(lang, 'title')}
      </h1>

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
          🏦 🏠 {housesLeft(game) ?? '∞'} · 🏨 {hotelsLeft(game) ?? '∞'}
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
