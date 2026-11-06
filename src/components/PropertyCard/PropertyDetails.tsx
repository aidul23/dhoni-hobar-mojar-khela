import { Hotel } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconText } from '../IconText';
import { GROUP_COLORS } from '../../data/properties';
import { getMortgageValue, getPrice, getPropertyDef } from '../../engine/property';
import { useT } from '../../store/gameStore';
import type { GameState } from '../../types/game';
import { formatMoney, formatNumber } from '../../utils/currency';

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-0.5">
      <span className="text-stone-500">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </div>
  );
}

export function PropertyHeader({ id }: { id: string }) {
  const def = getPropertyDef(id);
  return (
    <div>
      <div className="text-xl">{def.nameBn}</div>
      <div className="text-sm font-normal opacity-80">{def.nameEn}</div>
    </div>
  );
}

export const propertyAccent = (id: string) => GROUP_COLORS[getPropertyDef(id).group];

/** Full property information. `compact` shows only what the buy dialog needs. */
export function PropertyDetails({ id, game, compact = false }: { id: string; game: GameState; compact?: boolean }) {
  const t = useT();
  const def = getPropertyDef(id);
  const ps = game.properties[id];
  const owner = game.players.find((p) => p.id === ps.ownerId);

  return (
    <div className="text-sm">
      <Row label={t('price')} value={formatMoney(getPrice(game.settings, id))} />
      <Row label={t('group')} value={t(`group.${def.group}`)} />

      {def.kind === 'street' && (
        <>
          <Row label={t('baseRent')} value={formatMoney(def.rents[0])} />
          {!compact && (
            <>
              {[1, 2, 3, 4].map((n) => (
                <Row key={n} label={t('rentHouse', { n })} value={formatMoney(def.rents[n])} />
              ))}
              <Row label={t('rentHotel')} value={formatMoney(def.rents[5])} />
              <Row label={t('houseCost')} value={formatMoney(def.houseCost)} />
            </>
          )}
          <p className="mt-1 text-xs text-stone-500">{t('rentFullGroup')}</p>
        </>
      )}
      {def.kind === 'transport' && <p className="mt-1 text-xs text-stone-600">{t('transportRent')}</p>}
      {def.kind === 'utility' && <p className="mt-1 text-xs text-stone-600">{t('utilityRent')}</p>}

      {!compact && (
        <div className="mt-2 border-t border-stone-200 pt-2">
          <Row label={t('mortgageValue')} value={formatMoney(getMortgageValue(game.settings, id))} />
          <Row label={t('owner')} value={owner ? `${owner.token} ${owner.name}` : t('bank')} />
          {def.kind === 'street' && (
            <Row label={t('houses')} value={ps.hotel ? <IconText icon={Hotel} className="text-rose-700">{t('hotel')}</IconText> : formatNumber(ps.houses)} />
          )}
          <Row label={t('status')} value={ps.mortgaged ? t('mortgaged') : t('notMortgaged')} />
        </div>
      )}
    </div>
  );
}
