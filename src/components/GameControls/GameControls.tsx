import { canProposeTrade } from '../../engine/game';
import { buildingLevel, getPropertyDef } from '../../engine/property';
import { GROUP_COLORS } from '../../data/properties';
import { useGameStore, useT } from '../../store/gameStore';
import type { GameState } from '../../types/game';
import { formatMoney } from '../../utils/currency';
import { Dice } from '../Dice/Dice';
import { Button } from '../Modal/Button';
import { useCanAct, useOnlineView } from '../../store/onlineStore';
import { PrimaryTurnButton } from './PrimaryTurnButton';

const BuildingBadge = ({ level }: { level: number }) =>
  level === 0 ? null : <span className="ml-1">{level === 5 ? '🏨' : `🏠${level}`}</span>;

interface Props {
  game: GameState;
  faces: [number, number];
  rolling: boolean;
  /** True while dice spin or tokens move: all actions are locked. */
  busy: boolean;
  onRoll: () => void;
  onSelectProperty: (id: string) => void;
  onTrade: () => void;
}

export function GameControls({ game, faces, rolling, busy, onRoll, onSelectProperty, onTrade }: Props) {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  const dispatch = useGameStore((s) => s.dispatch);
  // After the game ends, show the winner rather than whoever made the last move.
  const player = game.players.find((p) => p.id === game.winnerId) ?? game.players[game.currentPlayerIndex];
  const { phase } = game;
  const fine = game.settings.jailFine;
  const canAct = useCanAct();
  const { online, myId } = useOnlineView();
  const myTurn = online && myId === game.players[game.currentPlayerIndex].id && phase !== 'gameOver';

  return (
    <section className="rounded-xl bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 text-2xl"
          style={{ borderColor: player.color }}
        >
          {player.token}
        </span>
        <div className="flex-1">
          {myTurn
            ? <div className="animate-pulse text-xs font-bold text-emerald-700">⭐ {t('yourTurn')}</div>
            : <div className="text-xs text-stone-500">{t('currentTurn')}</div>}
          <div className="font-bold" style={{ color: player.color }}>{player.name}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-stone-500">{t('cash')}</div>
          <div className="text-lg font-bold tabular-nums">{formatMoney(player.cash)}</div>
        </div>
      </div>

      <div className="my-4">
        <Dice faces={faces} rolling={rolling} size="3.25rem" />
      </div>

      <div className="flex flex-col gap-2">
        {phase === 'roll' && player.inJail && canAct({ type: 'PAY_JAIL_FINE' }) && (
          <p className="rounded-lg bg-stone-100 p-2 text-sm text-stone-700">🔒 {t('jailHint')}</p>
        )}
        {phase === 'roll' && <PrimaryTurnButton game={game} rolling={rolling} busy={busy} onRoll={onRoll} />}
        {phase === 'roll' && player.inJail && canAct({ type: 'PAY_JAIL_FINE' }) && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              disabled={busy || player.cash < fine}
              onClick={() => dispatch({ type: 'PAY_JAIL_FINE' })}
            >
              {t('payFine', { amount: formatMoney(fine) })}
            </Button>
            {player.getOutOfJailCards > 0 && (
              <Button variant="secondary" disabled={busy} onClick={() => dispatch({ type: 'USE_JAIL_CARD' })}>
                🎟️ {t('useJailCard')}
              </Button>
            )}
          </div>
        )}
        {phase === 'end' && <PrimaryTurnButton game={game} rolling={rolling} busy={busy} onRoll={onRoll} />}
        {canProposeTrade(game) && game.debts.length === 0 && canAct({ type: 'PROPOSE_TRADE', offer: { toId: '', offerCash: 0, offerProperties: [], requestCash: 0, requestProperties: [] } }) && (
          <Button variant="ghost" disabled={busy} onClick={onTrade}>🤝 {t('trade')}</Button>
        )}
        {phase === 'buy' && <p className="text-center text-sm text-stone-500">{t('waitBuy')}…</p>}
        {phase === 'card' && <p className="text-center text-sm text-stone-500">{t('waitCard')}…</p>}
      </div>

      <div className="mt-4">
        <h3 className="mb-1 text-sm font-bold text-emerald-800">
          {t('properties')} ({player.properties.length})
        </h3>
        {player.properties.length === 0 ? (
          <p className="text-sm text-stone-400">{t('noProperties')}</p>
        ) : (
          <>
          <p className="mb-1 text-xs text-stone-400">{t('manageHint')}</p>
          <div className="flex flex-wrap gap-1">
            {player.properties.map((id) => {
              const def = getPropertyDef(id);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectProperty(id)}
                  className={`rounded-md border-l-4 bg-stone-50 px-2 py-0.5 text-xs hover:bg-stone-100 ${game.properties[id].mortgaged ? 'opacity-50' : ''}`}
                  style={{ borderColor: GROUP_COLORS[def.group] }}
                >
                  {lang === 'bn' ? def.nameBn : def.nameEn}
                  <BuildingBadge level={buildingLevel(game.properties[id])} />
                </button>
              );
            })}
          </div>
          </>
        )}
      </div>
    </section>
  );
}
