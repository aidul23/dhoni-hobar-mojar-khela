import { useT } from '../../store/gameStore';
import type { GameState } from '../../types/game';
import { Button } from '../Modal/Button';
import { Modal } from '../Modal/Modal';
import { PropertyActions } from './PropertyActions';
import { PropertyDetails, PropertyHeader, propertyAccent } from './PropertyDetails';

export function PropertyModal({ id, game, onClose }: { id: string; game: GameState; onClose: () => void }) {
  const t = useT();
  return (
    <Modal
      title={<PropertyHeader id={id} />}
      accent={propertyAccent(id)}
      onClose={onClose}
      footer={<Button variant="ghost" onClick={onClose}>{t('close')}</Button>}
    >
      <PropertyDetails id={id} game={game} />
      <PropertyActions id={id} game={game} />
    </Modal>
  );
}
