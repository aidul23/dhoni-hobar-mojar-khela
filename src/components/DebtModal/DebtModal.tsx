import { useState } from 'react';
import { maxRaisableCash } from '../../engine/bankruptcy';
import { canProposeTrade } from '../../engine/game';
import { getPropertyDef } from '../../engine/property';
import { getPlayer } from '../../engine/state';
import { useGameStore, useT } from '../../store/gameStore';
import type { GameState } from '../../types/game';
import { formatMoney } from '../../utils/currency';
import { useCanAct } from '../../store/onlineStore';
import { WaitingFor } from '../GameControls/WaitingFor';
import { Button } from '../Modal/Button';
import { ConfirmModal } from '../Modal/ConfirmModal';
import { Modal } from '../Modal/Modal';
import { PropertyActions } from '../PropertyCard/PropertyActions';

export function DebtModal({ game, onTrade }: { game: GameState; onTrade: () => void }) {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  const dispatch = useGameStore((s) => s.dispatch);
  const [confirming, setConfirming] = useState(false);

  const debt = game.debts[0];
  const debtor = getPlayer(game, debt.debtorId);
  const creditorName = debt.creditorId ? getPlayer(game, debt.creditorId).name : t('bankShort');
  const canPay = debtor.cash >= debt.amount;
  const raisable = maxRaisableCash(game, debtor);
  const mine = useCanAct()({ type: 'PAY_DEBT' });

  if (confirming) {
    return (
      <ConfirmModal
        message={t('confirmBankruptcy', { player: debtor.name, creditor: creditorName })}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          dispatch({ type: 'DECLARE_BANKRUPTCY' });
        }}
      />
    );
  }

  return (
    <Modal
      title={`⚠️ ${t('debtTitle')}`}
      accent="#be123c"
      wide
      footer={
        mine ? (
          <>
            <Button variant="danger" disabled={canPay} onClick={() => setConfirming(true)}>{t('declareBankruptcy')}</Button>
            {canProposeTrade(game) && <Button variant="ghost" onClick={onTrade}>🤝 {t('trade')}</Button>}
            <Button disabled={!canPay} onClick={() => dispatch({ type: 'PAY_DEBT' })}>{t('payDebt')}</Button>
          </>
        ) : (
          <WaitingFor player={debtor} className="w-full" />
        )
      }
    >
      <p className="text-base font-semibold">
        {debtor.token} {t('debtText', { player: debtor.name, creditor: creditorName, amount: formatMoney(debt.amount) })}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-lg bg-stone-50 p-2">
          <div className="text-stone-500">{t('cash')}</div>
          <div className={`text-lg font-bold tabular-nums ${canPay ? 'text-emerald-700' : 'text-rose-700'}`}>{formatMoney(debtor.cash)}</div>
        </div>
        <div className="rounded-lg bg-stone-50 p-2">
          <div className="text-stone-500">{t('maxRaisable')}</div>
          <div className="text-lg font-bold tabular-nums">{formatMoney(raisable)}</div>
        </div>
      </div>
      <p className="mt-2 text-sm text-stone-600">{raisable < debt.amount ? `❗ ${t('cannotRaise')}` : t('debtHelp')}</p>

      <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
        {debtor.properties.map((id) => {
          const def = getPropertyDef(id);
          return (
            <li key={id} className="flex items-center justify-between gap-2 border-b border-stone-100 pb-2 text-sm">
              <span className={game.properties[id].mortgaged ? 'text-stone-400 line-through' : ''}>
                {lang === 'bn' ? def.nameBn : def.nameEn}
              </span>
              <PropertyActions id={id} game={game} compact />
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
