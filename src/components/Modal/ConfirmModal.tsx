import { useT } from '../../store/gameStore';
import { Button } from './Button';
import { Modal } from './Modal';

export function ConfirmModal({ message, onConfirm, onCancel }: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const t = useT();
  return (
    <Modal
      onClose={onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>{t('no')}</Button>
          <Button variant="danger" onClick={onConfirm}>{t('yes')}</Button>
        </>
      }
    >
      <p className="text-stone-800">{message}</p>
    </Modal>
  );
}
