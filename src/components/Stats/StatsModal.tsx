import { ChartColumn } from 'lucide-react';
import { IconText } from '../IconText';
import { useT } from '../../store/gameStore';
import type { GameState } from '../../types/game';
import { Button } from '../Modal/Button';
import { Modal } from '../Modal/Modal';
import { StatsTable } from './StatsTable';

export function StatsModal({ game, onClose }: { game: GameState; onClose: () => void }) {
  const t = useT();
  return (
    <Modal
      title={<IconText icon={ChartColumn}>{t('stats')}</IconText>}
      onClose={onClose}
      wide
      footer={<Button variant="ghost" onClick={onClose}>{t('close')}</Button>}
    >
      <StatsTable game={game} />
    </Modal>
  );
}
