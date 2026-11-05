import { GROUP_COLORS } from '../../data/properties';
import { hotelsInUse, hotelsLeft, housesInUse, housesLeft, unsoldProperties } from '../../engine/bank';
import { getPrice, getPropertyDef } from '../../engine/property';
import { useGameStore, useT } from '../../store/gameStore';
import type { GameState } from '../../types/game';
import { formatMoney } from '../../utils/currency';
import { Button } from '../Modal/Button';
import { Modal } from '../Modal/Modal';

function SupplyTile({ icon, label, left, limit, used }: {
  icon: string; label: string; left: number | null; limit: number | null; used: number;
}) {
  const t = useT();
  const pct = limit ? Math.round(((left ?? 0) / limit) * 100) : 100;
  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <div className="text-sm text-stone-500">{icon} {label}</div>
      <div className="text-2xl font-bold tabular-nums">
        {left === null ? t('unlimited') : <>{left}<span className="text-base font-normal text-stone-400"> / {limit}</span></>}
      </div>
      {limit && (
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-stone-200">
          <div className={`h-full ${pct < 25 ? 'bg-rose-500' : 'bg-emerald-600'}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      <div className="mt-1 text-xs text-stone-400">🏗️ {used}</div>
    </div>
  );
}

export function BankModal({ game, onClose, onSelectProperty }: {
  game: GameState;
  onClose: () => void;
  onSelectProperty: (id: string) => void;
}) {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  const unsold = unsoldProperties(game);

  return (
    <Modal
      title={`🏦 ${t('bankTitle')}`}
      accent="#1e3a8a"
      onClose={onClose}
      wide
      footer={<Button variant="ghost" onClick={onClose}>{t('close')}</Button>}
    >
      <p className="mb-3 text-sm text-stone-600">{t('bankIntro')}</p>
      <div className="grid grid-cols-2 gap-2">
        <SupplyTile icon="🏠" label={t('housesLeft')} left={housesLeft(game)} limit={game.settings.houseLimit} used={housesInUse(game)} />
        <SupplyTile icon="🏨" label={t('hotelsLeft')} left={hotelsLeft(game)} limit={game.settings.hotelLimit} used={hotelsInUse(game)} />
        <div className="rounded-lg bg-emerald-50 p-3">
          <div className="text-sm text-stone-500">⬇️ {t('bankReceived')}</div>
          <div className="text-xl font-bold tabular-nums text-emerald-800">{formatMoney(game.bank.received)}</div>
        </div>
        <div className="rounded-lg bg-amber-50 p-3">
          <div className="text-sm text-stone-500">⬆️ {t('bankPaid')}</div>
          <div className="text-xl font-bold tabular-nums text-amber-800">{formatMoney(game.bank.paid)}</div>
        </div>
      </div>

      <h3 className="mb-2 mt-4 font-bold text-blue-900">{t('unsold', { n: unsold.length })}</h3>
      {unsold.length === 0 ? (
        <p className="text-sm text-stone-500">{t('allSold')}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {unsold.map((id) => {
            const def = getPropertyDef(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => onSelectProperty(id)}
                className="flex items-center gap-1.5 rounded-md border-l-4 bg-stone-50 px-2 py-1 text-xs hover:bg-stone-100"
                style={{ borderColor: GROUP_COLORS[def.group] }}
              >
                <span>{lang === 'bn' ? def.nameBn : def.nameEn}</span>
                <span className="text-stone-400">{formatMoney(getPrice(game.settings, id))}</span>
              </button>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
