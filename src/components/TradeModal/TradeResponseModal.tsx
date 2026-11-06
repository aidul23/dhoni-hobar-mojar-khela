import { Handshake } from 'lucide-react';
import { IconText } from '../IconText';
import { getPropertyDef } from '../../engine/property';
import { getPlayer } from '../../engine/state';
import { useGameStore, useT } from '../../store/gameStore';
import type { GameState, Player } from '../../types/game';
import { formatMoney } from '../../utils/currency';
import { useCanAct, useOnlineView } from '../../store/onlineStore';
import { WaitingFor } from '../GameControls/WaitingFor';
import { Button } from '../Modal/Button';
import { Modal } from '../Modal/Modal';

function Gives({ player, cash, properties }: { player: Player; cash: number; properties: string[] }) {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  const items = [
    ...(cash > 0 ? [formatMoney(cash)] : []),
    ...properties.map((id) => (lang === 'bn' ? getPropertyDef(id).nameBn : getPropertyDef(id).nameEn)),
  ];
  return (
    <div className="flex-1 rounded-lg bg-stone-50 p-3">
      <div className="mb-1 font-bold" style={{ color: player.color }}>
        {player.token} {t('youGive', { player: player.name })}
      </div>
      <ul className="list-inside list-disc text-sm">
        {items.length ? items.map((i) => <li key={i}>{i}</li>) : <li className="list-none text-stone-400">{t('nothing')}</li>}
      </ul>
    </div>
  );
}

/** Shown to the receiving player (hot-seat) while a trade waits for an answer. */
export function TradeResponseModal({ game }: { game: GameState }) {
  const t = useT();
  const dispatch = useGameStore((s) => s.dispatch);
  const offer = game.pendingTrade!;
  const from = getPlayer(game, offer.fromId);
  const to = getPlayer(game, offer.toId);
  const canAct = useCanAct();
  const { online, myId } = useOnlineView();
  const isTarget = canAct({ type: 'ACCEPT_TRADE' });
  const isProposer = online && myId === from.id;

  return (
    <Modal
      title={<IconText icon={Handshake}>{t('tradeIncoming', { from: from.name, to: to.name })}</IconText>}
      accent={to.color}
      wide
      footer={
        isTarget ? (
          <>
            <Button variant="danger" onClick={() => dispatch({ type: 'REJECT_TRADE' })}>{t('reject')}</Button>
            <Button onClick={() => dispatch({ type: 'ACCEPT_TRADE' })}>{t('accept')}</Button>
          </>
        ) : isProposer ? (
          <>
            <WaitingFor player={to} className="flex-1" />
            <Button variant="ghost" onClick={() => dispatch({ type: 'REJECT_TRADE' })}>{t('withdrawTrade')}</Button>
          </>
        ) : (
          <WaitingFor player={to} className="w-full" />
        )
      }
    >
      {!online && <p className="mb-3 text-sm text-stone-500">{t('passDevice', { player: to.name })}</p>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Gives player={from} cash={offer.offerCash} properties={offer.offerProperties} />
        <Gives player={to} cash={offer.requestCash} properties={offer.requestProperties} />
      </div>
    </Modal>
  );
}
