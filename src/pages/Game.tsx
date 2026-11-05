import { useCallback, useEffect, useRef, useState } from 'react';
import { Board } from '../components/Board/Board';
import { CardModal } from '../components/CardModal/CardModal';
import { DebtModal } from '../components/DebtModal/DebtModal';
import { MoneyFlights, type Flight } from '../components/Effects/MoneyFlights';
import { GameControls } from '../components/GameControls/GameControls';
import { GameToolbar } from '../components/GameControls/GameToolbar';
import { MobileActionBar } from '../components/GameControls/MobileActionBar';
import { GameLog } from '../components/GameLog/GameLog';
import { Toast } from '../components/GameLog/Toast';
import { ConfirmModal } from '../components/Modal/ConfirmModal';
import { PlayerCard } from '../components/PlayerCard/PlayerCard';
import { BuyModal } from '../components/PropertyCard/BuyModal';
import { PropertyModal } from '../components/PropertyCard/PropertyModal';
import { BankModal } from '../components/Stats/BankModal';
import { RulesModal } from '../components/Stats/RulesModal';
import { StatsModal } from '../components/Stats/StatsModal';
import { WinnerScreen } from '../components/Stats/WinnerScreen';
import { TradeModal } from '../components/TradeModal/TradeModal';
import { TradeResponseModal } from '../components/TradeModal/TradeResponseModal';
import { totalDebt } from '../engine/bankruptcy';
import { netWorth } from '../engine/ranking';
import { useAnimatedPositions } from '../hooks/useAnimatedPositions';
import { useDiceAnimation } from '../hooks/useDiceRoll';
import { rollDice } from '../engine/dice';
import { useLogEvents } from '../hooks/useLogEvents';
import { useGameStore, useT } from '../store/gameStore';
import { useOnlineStore, useOnlineView } from '../store/onlineStore';
import type { GameState, LogEntry } from '../types/game';
import { playSound, soundForLogKeys } from '../utils/sound';

/** The one modal that must be answered before play continues. */
function BlockingModal({ game, trading, setTrading }: {
  game: GameState;
  trading: boolean;
  setTrading: (v: boolean) => void;
}) {
  if (game.pendingTrade) return <TradeResponseModal game={game} />;
  if (trading && game.phase !== 'gameOver') return <TradeModal game={game} onClose={() => setTrading(false)} />;
  if (game.debts.length > 0) return <DebtModal game={game} onTrade={() => setTrading(true)} />;
  if (game.phase === 'buy' && game.pendingPurchase) return <BuyModal id={game.pendingPurchase} game={game} />;
  if (game.phase === 'card' && game.pendingCard) {
    return <CardModal cardId={game.pendingCard.cardId} drawnBy={game.players[game.currentPlayerIndex]} />;
  }
  return null;
}

type Panel = 'stats' | 'rules' | 'bank' | 'confirmNew' | 'confirmReset' | 'confirmLeave' | null;

const REMOVE_AFTER_MS = 60_000;

/** Online: when each player went offline (as seen by this client), refreshed every few seconds. */
function useRemovablePlayers(view: ReturnType<typeof useOnlineView>, players: GameState['players']) {
  const since = useRef<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!view.online) return;
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [view.online]);

  const removable = new Set<string>();
  if (!view.online) return removable;
  for (const p of players) {
    const seat = view.seatOf(p.id);
    const offline = !!seat && !seat.connected && !p.bankrupt;
    if (!offline) {
      delete since.current[p.id];
      continue;
    }
    since.current[p.id] ??= now;
    if (now - since.current[p.id] >= REMOVE_AFTER_MS) removable.add(p.id);
  }
  return removable;
}

/** Online: a chime and banner when it becomes my turn. */
function useMyTurnAlert(game: GameState, myId: string | null, muted: boolean) {
  const current = game.players[game.currentPlayerIndex].id;
  const isMine = myId !== null && current === myId && game.phase !== 'gameOver';
  const turnKey = `${game.turnNumber}:${isMine}`;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (isMine) playSound('turn', muted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnKey]);
}

/** Sounds and coin animations for newly logged events. */
function useGameEffects(game: GameState, busy: boolean) {
  const muted = useGameStore((s) => s.muted);
  const [flights, setFlights] = useState<Flight[]>([]);
  const nextFlightId = useRef(1);

  useLogEvents(game.log, busy, (entries: LogEntry[]) => {
    const sound = soundForLogKeys(entries.map((e) => e.key));
    if (sound) playSound(sound, muted);

    const newFlights = entries
      .filter((e) => e.params.payerId && e.params.payeeId && typeof e.params.amount === 'number')
      .map((e) => ({
        id: nextFlightId.current++,
        fromId: String(e.params.payerId),
        toId: String(e.params.payeeId),
        amount: e.params.amount as number,
      }));
    if (newFlights.length) setFlights((f) => [...f, ...newFlights]);
  });

  const removeFlight = useCallback((id: number) => setFlights((f) => f.filter((x) => x.id !== id)), []);
  return { flights, removeFlight };
}

export function Game({ game }: { game: GameState }) {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  const dispatch = useGameStore((s) => s.dispatch);
  const saveGame = useGameStore((s) => s.saveGame);
  const exitToSetup = useGameStore((s) => s.exitToSetup);
  const resetGame = useGameStore((s) => s.resetGame);

  const [selected, setSelected] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [trading, setTrading] = useState(false);

  const muted = useGameStore((s) => s.muted);
  const view = useOnlineView();
  const pending = useOnlineStore((s) => s.pending);
  const connection = useOnlineStore((s) => s.status);
  const restartOnline = useOnlineStore((s) => s.restart);
  const leaveOnline = useOnlineStore((s) => s.leave);
  const removeOnline = useOnlineStore((s) => s.removePlayer);
  const [removing, setRemoving] = useState<string | null>(null);
  const onlineError = useOnlineStore((s) => s.error);
  const clearOnlineError = useOnlineStore((s) => s.clearError);

  const { rolling, faces } = useDiceAnimation(game.log, () => playSound('dice', muted));
  const { positions, moving } = useAnimatedPositions(game.players, rolling);
  // Dialogs and effects wait for animations; buttons also wait for the server's answer.
  const animating = rolling || moving;
  const busy = animating || pending;
  const removable = useRemovablePlayers(view, game.players);
  useMyTurnAlert(game, view.myId, muted);
  const shownFaces = rolling ? faces : (game.dice ?? [1, 1]);
  const { flights, removeFlight } = useGameEffects(game, animating);

  // Online the server replaces these dice with its own roll.
  const handleRoll = () => {
    if (!busy) dispatch({ type: 'ROLL', dice: rollDice() });
  };

  const handleSave = () => {
    if (!saveGame()) return;
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-3 p-3 pb-20 lg:grid lg:grid-cols-[230px_minmax(0,1fr)_320px] lg:pb-3">
      {/* Left: players */}
      <aside className="grid grid-cols-2 gap-2 lg:flex lg:flex-col">
        {game.players.map((p, i) => (
          <PlayerCard
            key={p.id}
            player={p}
            isCurrent={i === game.currentPlayerIndex && game.phase !== 'gameOver'}
            debt={totalDebt(game, p.id)}
            worth={netWorth(game, p)}
            isMe={view.online && p.id === view.myId}
            offline={view.online && view.seatOf(p.id)?.connected === false && !p.bankrupt}
            onRemove={view.isHost && removable.has(p.id) ? () => setRemoving(p.id) : undefined}
          />
        ))}
      </aside>

      {/* Centre: board */}
      <main className="min-w-0">
        <Board
          game={game}
          lang={lang}
          positions={positions}
          faces={shownFaces}
          rolling={rolling}
          onSelectProperty={setSelected}
        />
      </main>

      {/* Right: controls + log */}
      <aside className="flex flex-col gap-3 lg:max-h-[calc(100vh-5rem)]">
        <GameControls
          game={game}
          faces={shownFaces}
          rolling={rolling}
          busy={busy}
          onRoll={handleRoll}
          onSelectProperty={setSelected}
          onTrade={() => setTrading(true)}
        />
        <GameToolbar
          online={view.online}
          onLeave={() => setPanel('confirmLeave')}
          savedFlash={savedFlash}
          onSave={handleSave}
          onStats={() => setPanel('stats')}
          onRules={() => setPanel('rules')}
          onBank={() => setPanel('bank')}
          onReset={() => setPanel('confirmReset')}
          onNew={() => setPanel('confirmNew')}
        />
        <GameLog log={game.log} />
      </aside>

      {/* Modals: only after dice and tokens have settled. Trades and debts take priority. */}
      {!animating && <BlockingModal game={game} trading={trading} setTrading={setTrading} />}
      {!animating && game.phase === 'gameOver' && (
        view.online ? (
          <WinnerScreen
            game={game}
            onPlayAgain={view.isHost && view.room.seats.filter((s) => !s.left).length >= 2 ? restartOnline : undefined}
            onNewGame={leaveOnline}
            newGameLabel={t('leaveRoom')}
            note={view.isHost ? undefined : t('hostRestarts')}
          />
        ) : (
          <WinnerScreen game={game} onPlayAgain={resetGame} onNewGame={exitToSetup} />
        )
      )}
      {panel === 'bank' && <BankModal game={game} onClose={() => setPanel(null)} onSelectProperty={setSelected} />}
      {selected && <PropertyModal id={selected} game={game} onClose={() => setSelected(null)} />}
      {panel === 'stats' && <StatsModal game={game} onClose={() => setPanel(null)} />}
      {panel === 'rules' && <RulesModal game={game} onClose={() => setPanel(null)} />}
      {panel === 'confirmLeave' && (
        <ConfirmModal
          message={t('confirmLeave')}
          onCancel={() => setPanel(null)}
          onConfirm={() => { setPanel(null); leaveOnline(); }}
        />
      )}
      {removing && (
        <ConfirmModal
          message={t('confirmRemove', { player: game.players.find((p) => p.id === removing)?.name ?? '' })}
          onCancel={() => setRemoving(null)}
          onConfirm={() => {
            const seat = view.seatOf(removing);
            if (seat) removeOnline(seat.id);
            setRemoving(null);
          }}
        />
      )}
      {view.online && onlineError && (
        <button
          type="button"
          onClick={clearOnlineError}
          className="fixed inset-x-0 bottom-20 z-50 mx-auto w-fit max-w-[90vw] rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-lg lg:bottom-6"
        >
          ⚠️ {t(`error.${onlineError}`)} ✕
        </button>
      )}
      {view.online && connection !== 'open' && (
        <div className="fixed inset-x-0 top-0 z-50 bg-amber-400 py-1.5 text-center text-sm font-semibold text-stone-900 shadow">
          ⏳ {t('reconnecting')}
        </div>
      )}
      {(panel === 'confirmNew' || panel === 'confirmReset') && (
        <ConfirmModal
          message={t(panel === 'confirmNew' ? 'confirmNewGame' : 'confirmReset')}
          onCancel={() => setPanel(null)}
          onConfirm={() => {
            setPanel(null);
            if (panel === 'confirmNew') exitToSetup();
            else resetGame();
          }}
        />
      )}
      <MobileActionBar game={game} faces={shownFaces} rolling={rolling} busy={busy} onRoll={handleRoll} />
      <MoneyFlights flights={flights} onDone={removeFlight} />
      <Toast notice={game.notice} paused={animating} />
    </div>
  );
}
