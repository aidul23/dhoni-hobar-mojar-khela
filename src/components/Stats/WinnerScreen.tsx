import { finalRanking, netWorth } from '../../engine/ranking';
import { useT } from '../../store/gameStore';
import type { GameState } from '../../types/game';
import { formatMoney } from '../../utils/currency';
import { Confetti } from '../Effects/Confetti';
import { Button } from '../Modal/Button';
import { StatsTable } from './StatsTable';

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣'];

export function WinnerScreen({ game, onPlayAgain, onNewGame, newGameLabel, note }: {
  game: GameState;
  /** Omitted online for non-hosts: only the host can restart the room. */
  onPlayAgain?: () => void;
  onNewGame: () => void;
  newGameLabel?: string;
  note?: string;
}) {
  const t = useT();
  const ranking = finalRanking(game);
  const winner = ranking[0];
  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-emerald-950/70 p-3 sm:p-6" role="dialog" aria-modal="true">
      <Confetti />
      <div className="animate-pop relative z-50 flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="overflow-y-auto p-5 sm:p-6">
          <div className="text-center">
            <div className="animate-celebrate inline-block text-6xl">🏆</div>
            <h2 className="mt-2 text-3xl font-bold text-emerald-800">{t('winnerTitle')}</h2>
            <p className="mt-1 text-xl font-semibold" style={{ color: winner.color }}>
              {winner.token} {t('winnerText', { player: winner.name })}
            </p>
            {game.winReason && <p className="mt-1 text-stone-500">{t(`winReason.${game.winReason}`)}</p>}
          </div>

          <h3 className="mb-2 mt-5 font-bold text-emerald-800">{t('ranking')}</h3>
          <ol className="space-y-1.5">
            {ranking.map((p, i) => (
              <li
                key={p.id}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${i === 0 ? 'bg-amber-100 ring-1 ring-amber-300' : 'bg-stone-50'}`}
              >
                <span className="text-xl">{MEDALS[i]}</span>
                <span className="text-lg">{p.token}</span>
                <span className="flex-1 font-semibold" style={{ color: p.color }}>{p.name}</span>
                {p.bankrupt ? (
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">{t('bankrupt')}</span>
                ) : (
                  <span className="tabular-nums font-semibold">{formatMoney(netWorth(game, p))}</span>
                )}
              </li>
            ))}
          </ol>

          <h3 className="mb-2 mt-5 font-bold text-emerald-800">📊 {t('stats')}</h3>
          <StatsTable game={game} players={ranking} />
        </div>
        <div className="flex flex-col gap-2 border-t border-stone-100 bg-stone-50 p-4 sm:flex-row">
          {note && <p className="self-center text-sm text-stone-500 sm:flex-1">{note}</p>}
          {onPlayAgain && <Button variant="secondary" onClick={onPlayAgain}>↺ {t('playAgain')}</Button>}
          <Button onClick={onNewGame}>{newGameLabel ?? `＋ ${t('newGame')}`}</Button>
        </div>
      </div>
    </div>
  );
}
