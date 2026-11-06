import { Hotel, House, ScrollText } from 'lucide-react';
import type { ReactNode } from 'react';
import { IconText } from '../IconText';
import { useT } from '../../store/gameStore';
import type { GameState } from '../../types/game';
import { formatMoney } from '../../utils/currency';
import { Button } from '../Modal/Button';
import { Modal } from '../Modal/Modal';

const MODE_KEY = { classic: 'modeClassic', fast: 'modeFast', custom: 'modeCustom' } as const;

export function RulesModal({ game, onClose }: { game: GameState; onClose: () => void }) {
  const t = useT();
  const s = game.settings;
  const rows: [string, ReactNode][] = [
    [t('gameMode'), t(MODE_KEY[s.mode])],
    [t('startingCash'), formatMoney(s.startingCash)],
    [t('startBonus'), formatMoney(s.startBonus)],
    [t('jailFine'), formatMoney(s.jailFine)],
    [t('priceLevel'), `${Math.round(s.priceMultiplier * 100)}%`],
    [t('ownership'), s.victoryPercent ? t('percentOfProps', { n: s.victoryPercent }) : t('off')],
    [t('buildingSupply'), (
      <span className="inline-flex items-center gap-2">
        <IconText icon={House}>{s.houseLimit ?? t('unlimited')}</IconText>·<IconText icon={Hotel}>{s.hotelLimit ?? t('unlimited')}</IconText>
      </span>
    )],
    [t('turnLimit').replace(/\s*\(.*\)/, ''), s.turnLimit ? t('roundsThenRichest', { n: s.turnLimit }) : t('off')],
  ];
  return (
    <Modal
      title={<IconText icon={ScrollText}>{t('rulesTitle')}</IconText>}
      onClose={onClose}
      footer={<Button variant="ghost" onClick={onClose}>{t('close')}</Button>}
    >
      <dl className="text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 border-b border-stone-100 py-1.5">
            <dt className="text-stone-500">{label}</dt>
            <dd className="text-right font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-stone-700">{t('ruleSummary')}</p>
    </Modal>
  );
}
