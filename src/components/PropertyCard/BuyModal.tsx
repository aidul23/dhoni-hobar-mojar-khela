import { canBuy } from '../../engine/property';
import { useGameStore, useT } from '../../store/gameStore';
import type { GameState } from '../../types/game';
import { formatMoney } from '../../utils/currency';
import { useCanAct } from '../../store/onlineStore';
import { WaitingFor } from '../GameControls/WaitingFor';
import { Button } from '../Modal/Button';
import { Modal } from '../Modal/Modal';
import { PropertyDetails, PropertyHeader, propertyAccent } from './PropertyDetails';

export function BuyModal({ id, game }: { id: string; game: GameState }) {
  const t = useT();
  const dispatch = useGameStore((s) => s.dispatch);
  const player = game.players[game.currentPlayerIndex];
  const affordable = canBuy(game, player, id);
  const mine = useCanAct()({ type: 'BUY' });

  return (
    <Modal
      title={<PropertyHeader id={id} />}
      accent={propertyAccent(id)}
      footer={
        mine ? (
          <>
            <Button variant="ghost" onClick={() => dispatch({ type: 'DECLINE_BUY' })}>{t('dontBuy')}</Button>
            <Button disabled={!affordable} onClick={() => dispatch({ type: 'BUY' })}>{t('buy')}</Button>
          </>
        ) : (
          <WaitingFor player={player} className="w-full" />
        )
      }
    >
      <p className="mb-3 text-base font-semibold">{t('buyQuestion')}</p>
      <PropertyDetails id={id} game={game} compact />
      <p className="mt-3 text-sm">
        {player.token} {player.name}: <b>{formatMoney(player.cash)}</b>
      </p>
      {!affordable && <p className="mt-1 text-sm font-semibold text-rose-600">{t('notEnoughCash')}</p>}
    </Modal>
  );
}
