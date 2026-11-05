import { useState } from 'react';
import { getPropertyDef } from '../../engine/property';
import { actingPlayer } from '../../engine/state';
import { isTradable, validateTrade } from '../../engine/trading';
import { useGameStore, useT } from '../../store/gameStore';
import type { GameState, Player } from '../../types/game';
import { formatMoney } from '../../utils/currency';
import { Button } from '../Modal/Button';
import { Modal } from '../Modal/Modal';

function TradeSide({ player, game, cash, onCash, selected, onToggle }: {
  player: Player;
  game: GameState;
  cash: number;
  onCash: (n: number) => void;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  const tradable = player.properties.filter((id) => isTradable(game, id, player.id));

  return (
    <div className="min-w-0 flex-1 rounded-lg bg-stone-50 p-3">
      <div className="mb-2 font-bold" style={{ color: player.color }}>
        {player.token} {t('youGive', { player: player.name })}
      </div>
      <label className="text-xs text-stone-500">
        {t('cashAmount')} (≤ {formatMoney(player.cash)})
        <input
          type="number"
          min={0}
          max={player.cash}
          step={50}
          value={cash}
          onChange={(e) => onCash(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          className="mt-1 w-full rounded-md border border-stone-300 px-2 py-1 text-sm text-stone-900"
        />
      </label>
      <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
        {tradable.length === 0 && <p className="text-xs text-stone-400">{t('noTradable')}</p>}
        {tradable.map((id) => {
          const def = getPropertyDef(id);
          return (
            <label key={id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={selected.includes(id)} onChange={() => onToggle(id)} />
              {lang === 'bn' ? def.nameBn : def.nameEn}
            </label>
          );
        })}
      </div>
    </div>
  );
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

export function TradeModal({ game, onClose }: { game: GameState; onClose: () => void }) {
  const t = useT();
  const dispatch = useGameStore((s) => s.dispatch);
  const from = actingPlayer(game);
  const partners = game.players.filter((p) => !p.bankrupt && p.id !== from.id);

  const [toId, setToId] = useState(partners[0]?.id ?? '');
  const [offerCash, setOfferCash] = useState(0);
  const [requestCash, setRequestCash] = useState(0);
  const [offerProperties, setOfferProperties] = useState<string[]>([]);
  const [requestProperties, setRequestProperties] = useState<string[]>([]);

  const to = partners.find((p) => p.id === toId);
  const offer = { toId, offerCash, offerProperties, requestCash, requestProperties };
  const check = to ? validateTrade(game, { ...offer, fromId: from.id }) : 'inactivePlayer';

  const choosePartner = (id: string) => {
    setToId(id);
    setRequestCash(0);
    setRequestProperties([]);
  };

  const propose = () => {
    dispatch({ type: 'PROPOSE_TRADE', offer });
    onClose();
  };

  return (
    <Modal
      title={`🤝 ${t('tradeTitle')}`}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t('cancel')}</Button>
          <Button disabled={check !== 'ok'} onClick={propose}>{t('propose')}</Button>
        </>
      }
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-stone-600">{t('tradeWith')}</span>
        {partners.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => choosePartner(p.id)}
            className={`rounded-full px-3 py-1 font-semibold ring-1 ${p.id === toId ? 'text-white' : 'bg-white ring-stone-300'}`}
            style={p.id === toId ? { background: p.color } : undefined}
          >
            {p.token} {p.name}
          </button>
        ))}
      </div>
      {to && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <TradeSide
            player={from} game={game}
            cash={offerCash} onCash={setOfferCash}
            selected={offerProperties} onToggle={(id) => setOfferProperties((l) => toggle(l, id))}
          />
          <TradeSide
            player={to} game={game}
            cash={requestCash} onCash={setRequestCash}
            selected={requestProperties} onToggle={(id) => setRequestProperties((l) => toggle(l, id))}
          />
        </div>
      )}
      {check !== 'ok' && <p className="mt-3 text-sm text-rose-600">{t(`reason.${check}`)}</p>}
    </Modal>
  );
}
