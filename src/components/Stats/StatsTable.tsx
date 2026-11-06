import { Star } from 'lucide-react';
import { netWorth } from '../../engine/ranking';
import { emptyStats } from '../../engine/stats';
import { useT } from '../../store/gameStore';
import type { GameState, Player, PlayerStats } from '../../types/game';
import { formatMoney } from '../../utils/currency';

const ROWS: { key: keyof PlayerStats; money?: boolean }[] = [
  { key: 'rentReceived', money: true },
  { key: 'rentPaid', money: true },
  { key: 'taxesPaid', money: true },
  { key: 'propertiesBought' },
  { key: 'housesBuilt' },
  { key: 'hotelsBuilt' },
  { key: 'tradesCompleted' },
  { key: 'passedStart' },
  { key: 'doublesRolled' },
  { key: 'cardsDrawn' },
  { key: 'jailVisits' },
  { key: 'turnsPlayed' },
];

/** Players as columns, statistics as rows; the best value in each "good" row gets a star. */
export function StatsTable({ game, players }: { game: GameState; players?: Player[] }) {
  const t = useT();
  const cols = players ?? game.players;
  const stat = (p: Player) => game.stats[p.id] ?? emptyStats();
  const highlight = new Set<keyof PlayerStats>(['rentReceived', 'propertiesBought', 'housesBuilt', 'hotelsBuilt']);

  const cell = (value: number, money?: boolean) => (money ? formatMoney(value) : value);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[22rem] text-sm">
        <thead>
          <tr className="border-b border-stone-200">
            <th />
            {cols.map((p) => (
              <th key={p.id} className="px-2 py-1.5 text-right font-bold" style={{ color: p.color }}>
                <span className={p.bankrupt ? 'line-through opacity-60' : ''}>{p.token} {p.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-stone-200 bg-emerald-50 font-semibold">
            <td className="px-2 py-1.5">{t('netWorth')}</td>
            {cols.map((p) => (
              <td key={p.id} className="px-2 py-1.5 text-right tabular-nums">{formatMoney(netWorth(game, p))}</td>
            ))}
          </tr>
          {ROWS.map(({ key, money }) => {
            const values = cols.map((p) => stat(p)[key]);
            const best = Math.max(...values);
            return (
              <tr key={key} className="border-b border-stone-100 last:border-0">
                <td className="px-2 py-1 text-stone-600">{t(`stat.${key}`)}</td>
                {cols.map((p, i) => (
                  <td key={p.id} className="px-2 py-1 text-right tabular-nums">
                    {highlight.has(key) && best > 0 && values[i] === best && <Star className="mr-1 inline h-3.5 w-3.5 fill-amber-400 text-amber-500" aria-label={t('statBest')} />}
                    {cell(values[i], money)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
