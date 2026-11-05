import type { GameAction, GamePhase, GameState } from '../types/game';
import { chargePlayer, declareBankruptcy, forfeitPlayer, payFirstDebt } from './bankruptcy';
import { buildHotel, buildHouse, sellBuilding } from './building';
import { applyCardEffect, getCard } from './cards';
import { isDoubles, isValidDice } from './dice';
import { MAX_JAIL_TURNS, payJailFine, releaseFromJail, sendToJail, useJailCard } from './jail';
import { landOn } from './landing';
import { mortgageProperty, unmortgageProperty } from './mortgage';
import { movePlayerBy } from './movement';
import { buyProperty, getPrice } from './property';
import { actingPlayer, addLog, currentPlayer, getPlayer } from './state';
import { addStat } from './stats';
import { executeTrade, validateTrade } from './trading';
import { endTurn, finishAction } from './turn';
import { checkVictory } from './victory';

/** Phases in which the acting player may manage properties (build, mortgage, ...). */
const MANAGE_PHASES: GamePhase[] = ['roll', 'buy', 'end'];
/** Trades are proposed only at a calm point of the turn. */
const TRADE_PHASES: GamePhase[] = ['roll', 'end'];

/**
 * Pure game reducer. Invalid actions return the original state object unchanged,
 * so callers can detect them with a reference check.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.phase === 'gameOver') return state;
  const s = structuredClone(state);
  if (!applyAction(s, action)) return state;
  checkVictory(s);
  return s;
}

/** True when normal turn actions may run: no open debt and no trade awaiting an answer. */
export function isTurnFlowFree(s: GameState): boolean {
  return s.debts.length === 0 && s.pendingTrade === null;
}

/** Selling and mortgaging: allowed during the own turn, or while in debt. */
export function canRaiseFunds(s: GameState): boolean {
  return !s.pendingTrade && (s.debts.length > 0 || MANAGE_PHASES.includes(s.phase));
}

/** Building and lifting mortgages costs money, so it is blocked while anyone is in debt. */
export function canSpendOnAssets(s: GameState): boolean {
  return isTurnFlowFree(s) && MANAGE_PHASES.includes(s.phase);
}

export function canProposeTrade(s: GameState): boolean {
  return !s.pendingTrade && (s.debts.length > 0 || TRADE_PHASES.includes(s.phase));
}

function applyAction(s: GameState, action: GameAction): boolean {
  const player = currentPlayer(s);
  const actor = actingPlayer(s);
  const free = isTurnFlowFree(s);

  switch (action.type) {
    case 'ROLL': {
      if (!free || s.phase !== 'roll' || !isValidDice(action.dice)) return false;
      const dice = action.dice;
      const total = dice[0] + dice[1];
      s.dice = dice;
      addLog(s, 'rolled', { player: player.name, d1: dice[0], d2: dice[1], total });

      if (player.inJail) {
        rollInJail(s, dice);
        return true;
      }

      if (isDoubles(dice)) {
        s.doublesCount += 1;
        addStat(s, player.id, 'doublesRolled');
        if (s.doublesCount >= 3) {
          addLog(s, 'threeDoubles', { player: player.name });
          sendToJail(s, player);
          finishAction(s);
          return true;
        }
        s.canRollAgain = true;
        addLog(s, 'rolledDoubles', { player: player.name });
      } else {
        s.canRollAgain = false;
      }

      movePlayerBy(s, player, total);
      landOn(s);
      return true;
    }

    case 'BUY': {
      const id = s.pendingPurchase;
      if (!free || s.phase !== 'buy' || !id) return false;
      const price = getPrice(s.settings, id);
      if (!buyProperty(s, player, id)) return false;
      addStat(s, player.id, 'propertiesBought');
      addLog(s, 'bought', { player: player.name, space: player.position, amount: price });
      finishAction(s);
      return true;
    }

    case 'DECLINE_BUY': {
      if (!free || s.phase !== 'buy' || !s.pendingPurchase) return false;
      addLog(s, 'declined', { player: player.name, space: player.position });
      finishAction(s);
      return true;
    }

    case 'RESOLVE_CARD': {
      if (!free || s.phase !== 'card' || !s.pendingCard) return false;
      const card = getCard(s.pendingCard.cardId);
      s.pendingCard = null;
      const result = applyCardEffect(s, card);
      if (result === 'land') landOn(s);
      else finishAction(s);
      return true;
    }

    case 'PAY_JAIL_FINE':
      return free && s.phase === 'roll' && payJailFine(s, player);

    case 'USE_JAIL_CARD':
      return free && s.phase === 'roll' && useJailCard(s, player);

    case 'END_TURN':
      if (!free || s.phase !== 'end') return false;
      endTurn(s);
      return true;

    case 'BUILD_HOUSE':
      return canSpendOnAssets(s) && buildHouse(s, actor, action.propertyId);

    case 'BUILD_HOTEL':
      return canSpendOnAssets(s) && buildHotel(s, actor, action.propertyId);

    case 'UNMORTGAGE':
      return canSpendOnAssets(s) && unmortgageProperty(s, actor, action.propertyId);

    case 'SELL_BUILDING':
      return canRaiseFunds(s) && sellBuilding(s, actor, action.propertyId);

    case 'MORTGAGE':
      return canRaiseFunds(s) && mortgageProperty(s, actor, action.propertyId);

    case 'PROPOSE_TRADE': {
      if (!canProposeTrade(s)) return false;
      const offer = { ...action.offer, fromId: actor.id };
      if (validateTrade(s, offer) !== 'ok') return false;
      s.pendingTrade = offer;
      addLog(s, 'tradeProposed', { from: actor.name, to: getPlayer(s, offer.toId).name });
      return true;
    }

    case 'ACCEPT_TRADE': {
      const offer = s.pendingTrade;
      if (!offer) return false;
      s.pendingTrade = null;
      // Re-validated in case something changed; an invalid trade is simply dropped.
      if (!executeTrade(s, offer)) addLog(s, 'tradeInvalid');
      return true;
    }

    case 'REJECT_TRADE': {
      const offer = s.pendingTrade;
      if (!offer) return false;
      s.pendingTrade = null;
      addLog(s, 'tradeRejected', { to: getPlayer(s, offer.toId).name });
      return true;
    }

    case 'PAY_DEBT':
      return !s.pendingTrade && payFirstDebt(s);

    case 'DECLARE_BANKRUPTCY':
      return !s.pendingTrade && declareBankruptcy(s);

    case 'FORFEIT':
      return forfeitPlayer(s, action.playerId);
  }
}

function rollInJail(s: GameState, dice: [number, number]): void {
  const player = currentPlayer(s);
  s.canRollAgain = false; // leaving jail with doubles never grants another roll
  const total = dice[0] + dice[1];

  if (isDoubles(dice)) {
    addStat(s, player.id, 'doublesRolled');
    releaseFromJail(player);
    addLog(s, 'jailDoubles', { player: player.name });
  } else {
    player.jailTurns += 1;
    if (player.jailTurns < MAX_JAIL_TURNS) {
      addLog(s, 'jailStay', { player: player.name, turns: player.jailTurns, max: MAX_JAIL_TURNS });
      finishAction(s);
      return;
    }
    // Final attempt failed: the fine is mandatory (owed as a debt if unaffordable), then the player moves.
    const fine = s.settings.jailFine;
    if (chargePlayer(s, player, fine, null)) addLog(s, 'jailForcedFine', { player: player.name, amount: fine });
    releaseFromJail(player);
  }

  movePlayerBy(s, player, total);
  landOn(s);
}
