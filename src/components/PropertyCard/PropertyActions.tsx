import { buildingSellValue, checkBuildHotel, checkBuildHouse, checkSellBuilding } from '../../engine/building';
import { canRaiseFunds, canSpendOnAssets } from '../../engine/game';
import { checkMortgage, checkUnmortgage } from '../../engine/mortgage';
import { getMortgageValue, getPropertyDef, getUnmortgageCost } from '../../engine/property';
import { actingPlayer } from '../../engine/state';
import { useGameStore, useT } from '../../store/gameStore';
import { useCanAct } from '../../store/onlineStore';
import type { GameAction, GameState } from '../../types/game';
import { formatMoney } from '../../utils/currency';

interface ActionSpec {
  label: string;
  amount: string;
  action: GameAction;
  reason: string; // 'ok' or a reason code
}

/** Build / sell / mortgage buttons for one property of the acting player. */
export function PropertyActions({ id, game, compact = false }: { id: string; game: GameState; compact?: boolean }) {
  const t = useT();
  const dispatch = useGameStore((s) => s.dispatch);
  const canAct = useCanAct();
  const player = actingPlayer(game);
  const ps = game.properties[id];
  if (ps.ownerId !== player.id || game.phase === 'gameOver') return null;
  // Online: only the player who may manage this property sees its buttons.
  if (!canAct({ type: 'MORTGAGE', propertyId: id }) && !canAct({ type: 'BUILD_HOUSE', propertyId: id })) return null;

  const def = getPropertyDef(id);
  const spend = canSpendOnAssets(game);
  const raise = canRaiseFunds(game);
  const gate = (allowed: boolean, check: string) => (allowed ? check : 'notNow');
  const mineFor = (a: GameAction) => canAct(a);

  const actions: ActionSpec[] = [];
  if (def.kind === 'street') {
    if (!compact) {
      actions.push(
        { label: t('buildHouse'), amount: `-${formatMoney(def.houseCost)}`, action: { type: 'BUILD_HOUSE', propertyId: id }, reason: gate(spend, checkBuildHouse(game, player, id)) },
        { label: t('buildHotel'), amount: `-${formatMoney(def.houseCost)}`, action: { type: 'BUILD_HOTEL', propertyId: id }, reason: gate(spend, checkBuildHotel(game, player, id)) },
      );
    }
    actions.push({ label: t('sellBuilding'), amount: `+${formatMoney(buildingSellValue(id))}`, action: { type: 'SELL_BUILDING', propertyId: id }, reason: gate(raise, checkSellBuilding(game, player, id)) });
  }
  if (ps.mortgaged) {
    if (!compact) {
      actions.push({ label: t('unmortgage'), amount: `-${formatMoney(getUnmortgageCost(game.settings, id))}`, action: { type: 'UNMORTGAGE', propertyId: id }, reason: gate(spend, checkUnmortgage(game, player, id)) });
    }
  } else {
    actions.push({ label: t('mortgage'), amount: `+${formatMoney(getMortgageValue(game.settings, id))}`, action: { type: 'MORTGAGE', propertyId: id }, reason: gate(raise, checkMortgage(game, player, id)) });
  }

  for (const a of actions) if (a.reason === 'ok' && !mineFor(a.action)) a.reason = 'notNow';
  // In the compact (debt) view, hide actions that can never apply, e.g. selling with no buildings.
  const visible = compact ? actions.filter((a) => a.reason === 'ok') : actions;
  const firstBlocked = actions.find((a) => a.reason !== 'ok');

  return (
    <div className={compact ? 'flex flex-wrap gap-1' : 'mt-3 border-t border-stone-200 pt-3'}>
      <div className={compact ? 'contents' : 'grid grid-cols-2 gap-2'}>
        {visible.map((a) => (
          <button
            key={a.action.type}
            type="button"
            disabled={a.reason !== 'ok'}
            title={a.reason !== 'ok' ? t(`reason.${a.reason}`) : undefined}
            onClick={() => dispatch(a.action)}
            className="flex flex-col items-center rounded-lg bg-emerald-50 px-2 py-1.5 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-200 transition hover:bg-emerald-100 active:scale-95 disabled:cursor-not-allowed disabled:bg-stone-50 disabled:text-stone-400 disabled:ring-stone-200"
          >
            <span>{a.label}</span>
            <span className="tabular-nums font-normal">{a.amount}</span>
          </button>
        ))}
      </div>
      {!compact && firstBlocked && (
        <p className="mt-2 text-xs text-stone-500">ℹ️ {t(`reason.${firstBlocked.reason}`)}</p>
      )}
    </div>
  );
}
